const Workload = require('../models/Workload');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const logActivity = require('../utils/logActivity');

const getWorkloads = async (req, res) => {
  try {
    const workloads = await Workload.find({}).populate('facultyId').populate('subjectId');
    res.json(workloads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignWorkload = async (req, res) => {
  try {
    const { facultyId, subjectId, assignedHours } = req.body;

    const faculty = await Faculty.findById(facultyId);
    const subject = await Subject.findById(subjectId);

    if (!faculty || !subject) {
      return res.status(404).json({ message: 'Faculty or Subject not found' });
    }

    // Check if subject is already assigned to this faculty
    const duplicate = await Workload.findOne({ facultyId, subjectId });
    if (duplicate) {
      return res.status(400).json({ message: 'This subject is already assigned to this faculty member' });
    }

    // Checking if workload exceeds
    const existingWorkloads = await Workload.find({ facultyId });
    const currentTotalHours = existingWorkloads.reduce((acc, curr) => acc + curr.assignedHours, 0);

    if (currentTotalHours + assignedHours > faculty.maxWorkloadHours) {
      return res.status(400).json({ message: 'Max workload hours exceeded for this faculty' });
    }

    const workload = await Workload.create({
      facultyId,
      subjectId,
      assignedHours
    });

    await logActivity('Workload Assigned', `${assignedHours} hours of "${subject.subjectName}" assigned to ${faculty.name}`, 'Workload');
    res.status(201).json(workload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeWorkload = async (req, res) => {
  try {
    const workload = await Workload.findById(req.params.id);

    if (workload) {
      await Workload.findByIdAndDelete(req.params.id);
      res.json({ message: 'Workload removed' });
    } else {
      res.status(404).json({ message: 'Workload not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateWorkload = async (req, res) => {
  try {
    const workload = await Workload.findById(req.params.id);

    if (workload) {
      const { facultyId, subjectId, assignedHours } = req.body;
      const faculty = await Faculty.findById(facultyId || workload.facultyId);
      const subject = await Subject.findById(subjectId || workload.subjectId);

      if (!faculty || !subject) {
        return res.status(404).json({ message: 'Faculty or Subject not found' });
      }

      const existingWorkloads = await Workload.find({ facultyId: faculty._id, _id: { $ne: workload._id } });
      const currentTotalHours = existingWorkloads.reduce((acc, curr) => acc + curr.assignedHours, 0);

      const newAssignedHours = Number(assignedHours) || workload.assignedHours;
      if (currentTotalHours + newAssignedHours > faculty.maxWorkloadHours) {
        return res.status(400).json({ message: 'Max workload hours exceeded for this faculty' });
      }

      workload.facultyId = facultyId || workload.facultyId;
      workload.subjectId = subjectId || workload.subjectId;
      workload.assignedHours = newAssignedHours;

      const updatedWorkload = await workload.save();
      res.json(updatedWorkload);
    } else {
      res.status(404).json({ message: 'Workload not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getWorkloads, assignWorkload, removeWorkload, updateWorkload };
