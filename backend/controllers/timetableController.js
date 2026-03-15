const Timetable = require('../models/Timetable');
const Workload = require('../models/Workload');
const Classroom = require('../models/Classroom');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Settings = require('../models/Settings');
const logActivity = require('../utils/logActivity');

const getTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.find({})
      .populate('subject')
      .populate('faculty')
      .populate({
        path: 'classroom',
        populate: { path: 'roomType' }
      });
    const settings = await Settings.findOne();
    res.json({ timetable, settings: settings || { workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], saturdayMode: 'None' } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const timetable = await Timetable.find({})
      .populate('subject')
      .populate('faculty')
      .populate({
        path: 'classroom',
        populate: { path: 'roomType' }
      });

    const workloads = await Workload.find({})
      .populate('facultyId')
      .populate('subjectId');
      
    res.json({ timetable, workloads });
  } catch(error) {
    res.status(500).json({ message: error.message });
  }
};

const generateTimetable = async (req, res) => {
  try {
    await Timetable.deleteMany({}); // clear existing
    const workloads = await Workload.find({}).populate('facultyId').populate('subjectId');
    const classrooms = await Classroom.find({});
    const settings = await Settings.findOne() || { workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] };

    if (classrooms.length === 0) {
      return res.status(400).json({ message: 'No classrooms available' });
    }

    const days = settings.workingDays;
    const timeSlots = ['09:00-10:00', '10:00-11:00', '11:15-12:15', '12:15-13:15', '14:00-15:00', '15:00-16:00', '16:00-17:00'];


    const newTimetable = [];

    // Simple Greedy Approach
    // Needs to allocate 'assignedHours' for each workload entry

    let workloadList = workloads.map(w => ({
      workloadId: w._id,
      facultyId: w.facultyId._id,
      subjectId: w.subjectId._id,
      hoursLeft: w.assignedHours
    }));

    for (const load of workloadList) {
      while (load.hoursLeft > 0) {
        let scheduled = false;

        for (const day of days) {
          if (scheduled) break;

          for (const slot of timeSlots) {
            if (scheduled) break;

            for (const room of classrooms) {
              // Check if faculty is busy at this day & slot
              const isFacultyBusy = newTimetable.some(t => t.day === day && t.timeSlot === slot && t.faculty.toString() === load.facultyId.toString());

              // Check if classroom is occupied at this day & slot
              const isRoomOccupied = newTimetable.some(t => t.day === day && t.timeSlot === slot && t.classroom.toString() === room._id.toString());

              if (!isFacultyBusy && !isRoomOccupied) {
                newTimetable.push({
                  day,
                  timeSlot: slot,
                  subject: load.subjectId,
                  faculty: load.facultyId,
                  classroom: room._id
                });
                load.hoursLeft -= 1;
                scheduled = true;
                break;
              }
            }
          }
        }

        if (!scheduled) {
          // Could not schedule, conflicts exist that simple greedy couldn't resolve
          load.hoursLeft -= 1; // Decrease just to avoid infinite loop
          console.warn(`Could not schedule 1 hr for Subject: ${load.subjectId} with Faculty: ${load.facultyId}`);
        }
      }
    }

    await Timetable.insertMany(newTimetable);
    await logActivity('Timetable Generated', `Auto-generated timetable with ${newTimetable.length} class slots`, 'Timetable');
    res.json({ message: 'Timetable generated successfully', count: newTimetable.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const updateTimetableSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, faculty, classroom, day, timeSlot } = req.body;
    
    const slot = await Timetable.findById(id);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });

    // Determine the effective day and timeSlot (new values or existing)
    const targetDay = day || slot.day;
    const targetTimeSlot = timeSlot || slot.timeSlot;
    const targetFaculty = faculty || slot.faculty.toString();
    const targetClassroom = classroom || slot.classroom.toString();

    // ─── Conflict checks against the TARGET day+time ─────────────────────────

    // Faculty conflict: same faculty already assigned at target day+slot (on a DIFFERENT slot doc)
    const facultyConflict = await Timetable.findOne({
      _id: { $ne: id },
      day: targetDay,
      timeSlot: targetTimeSlot,
      faculty: targetFaculty
    });
    if (facultyConflict) {
      return res.status(400).json({ message: `Faculty is already assigned at ${targetDay} ${targetTimeSlot}` });
    }

    // Classroom conflict: same room already booked at target day+slot
    const roomConflict = await Timetable.findOne({
      _id: { $ne: id },
      day: targetDay,
      timeSlot: targetTimeSlot,
      classroom: targetClassroom
    });
    if (roomConflict) {
      return res.status(400).json({ message: `Classroom is already occupied at ${targetDay} ${targetTimeSlot}` });
    }

    // Subject conflict: same subject already scheduled at target day+slot
    const targetSubject = subject || slot.subject.toString();
    const subjectConflict = await Timetable.findOne({
      _id: { $ne: id },
      day: targetDay,
      timeSlot: targetTimeSlot,
      subject: targetSubject
    });
    if (subjectConflict) {
      return res.status(400).json({ message: `Subject is already scheduled at ${targetDay} ${targetTimeSlot}` });
    }

    // ─── Apply changes ────────────────────────────────────────────────────────
    slot.day = targetDay;
    slot.timeSlot = targetTimeSlot;
    slot.faculty = targetFaculty;
    slot.classroom = targetClassroom;
    slot.subject = targetSubject;

    const updatedSlot = await slot.save();
    await logActivity('Timetable Slot Updated', `Slot rescheduled to ${targetDay} at ${targetTimeSlot}`, 'Timetable');
    res.json(updatedSlot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTimetableSlot = async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTimetable, generateTimetable, getReports, updateTimetableSlot, deleteTimetableSlot };
