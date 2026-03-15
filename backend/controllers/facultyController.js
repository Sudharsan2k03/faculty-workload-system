const Faculty = require('../models/Faculty');
const User = require('../models/User');
const Workload = require('../models/Workload');
const Timetable = require('../models/Timetable');
const Settings = require('../models/Settings');
const logActivity = require('../utils/logActivity');

const getFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find({});
    // Compute current workload for each faculty
    const facultiesWithWorkload = await Promise.all(faculties.map(async (faculty) => {
      const workloads = await Workload.find({ facultyId: faculty._id });
      const currentWorkload = workloads.reduce((acc, curr) => acc + curr.assignedHours, 0);
      return { ...faculty._doc, currentWorkload };
    }));
    res.json(facultiesWithWorkload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createFaculty = async (req, res) => {
  try {
    const { facultyId, name, department, designation, email, maxWorkloadHours } = req.body;

    const emailExists = await Faculty.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email address already in use' });
    }

    const idExists = await Faculty.findOne({ facultyId });
    if (idExists) {
      return res.status(400).json({ message: 'Faculty ID already exists' });
    }

    const faculty = await Faculty.create({
      facultyId,
      name,
      department,
      designation,
      email,
      maxWorkloadHours
    });

    // Automatically create a user account for the faculty
    const user = await User.create({
      name,
      email,
      password: 'password123', // Default password
      role: 'faculty',
      facultyId: faculty._id
    });

    await logActivity('Faculty Added', `"${name}" added to ${department} department`, 'Faculty');
    res.status(201).json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);

    if (faculty) {
      const { facultyId, email } = req.body;

      // Check unique facultyId if changed
      if (facultyId && facultyId !== faculty.facultyId) {
        const idExists = await Faculty.findOne({ facultyId });
        if (idExists) {
          return res.status(400).json({ message: 'Faculty ID already exists' });
        }
        faculty.facultyId = facultyId;
      }

      // Check unique email if changed
      if (email && email !== faculty.email) {
        const emailExists = await Faculty.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        
        // Find if user exists with old email
        const user = await User.findOne({ email: faculty.email });
        if(user) {
          user.email = email;
          await user.save();
        }
        faculty.email = email;
      }

      faculty.name = req.body.name || faculty.name;
      faculty.department = req.body.department || faculty.department;
      faculty.designation = req.body.designation || faculty.designation;
      faculty.maxWorkloadHours = req.body.maxWorkloadHours || faculty.maxWorkloadHours;

      const updatedFaculty = await faculty.save();
      await logActivity('Faculty Updated', `"${updatedFaculty.name}" details updated`, 'Faculty');
      res.json(updatedFaculty);
    } else {
      res.status(404).json({ message: 'Faculty not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);

    if (faculty) {
      const facultyName = faculty.name;
      await User.findOneAndDelete({ email: faculty.email });
      await Workload.deleteMany({ facultyId: faculty._id });
      await Timetable.deleteMany({ faculty: faculty._id });
      await Faculty.findByIdAndDelete(req.params.id);
      await logActivity('Faculty Deleted', `"${facultyName}" removed from system`, 'Faculty');
      res.json({ message: 'Faculty removed' });
    } else {
      res.status(404).json({ message: 'Faculty not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Also endpoint for getting single faculty workloads (useful for faculty dashboard)
const getFacultyDashboardDetails = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user.facultyId);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

    const workloads = await Workload.find({ facultyId: faculty._id }).populate('subjectId');
    const timetables = await Timetable.find({ faculty: faculty._id }).populate('subject').populate('classroom');
    const settings = await Settings.findOne();

    res.json({ faculty, workloads, timetables, settings: settings || { workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], saturdayMode: 'None' } });
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getFaculties, createFaculty, updateFaculty, deleteFaculty, getFacultyDashboardDetails };
