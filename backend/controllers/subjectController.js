const Subject = require('../models/Subject');
const Workload = require('../models/Workload');
const Timetable = require('../models/Timetable');
const logActivity = require('../utils/logActivity');

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({});
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const { subjectId, subjectName, department, hoursPerWeek } = req.body;

    const subjectExists = await Subject.findOne({ subjectId });
    if (subjectExists) {
      return res.status(400).json({ message: 'Subject already exists' });
    }

    const subject = await Subject.create({
      subjectId,
      subjectName,
      department,
      hoursPerWeek
    });

    await logActivity('Subject Added', `"${subjectName}" added to ${department} department`, 'Subject');
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSubject = async (req, res) => {
    try {
      const subject = await Subject.findById(req.params.id);
  
      if (subject) {
        const { subjectId } = req.body;

        if (subjectId && subjectId !== subject.subjectId) {
          const exists = await Subject.findOne({ subjectId });
          if (exists) {
            return res.status(400).json({ message: 'Subject ID already exists' });
          }
          subject.subjectId = subjectId;
        }

        subject.subjectName = req.body.subjectName || subject.subjectName;
        subject.department = req.body.department || subject.department;
        subject.hoursPerWeek = req.body.hoursPerWeek || subject.hoursPerWeek;
  
        const updatedSubject = await subject.save();
        await logActivity('Subject Updated', `"${updatedSubject.subjectName}" details updated`, 'Subject');
        res.json(updatedSubject);
      } else {
        res.status(404).json({ message: 'Subject not found' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (subject) {
      await Workload.deleteMany({ subjectId: subject._id });
      await Timetable.deleteMany({ subject: subject._id });
      await Subject.findByIdAndDelete(req.params.id);
      await logActivity('Subject Deleted', `"${subject.subjectName}" removed from system`, 'Subject');
      res.json({ message: 'Subject removed' });
    } else {
      res.status(404).json({ message: 'Subject not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSubjects, createSubject, updateSubject, deleteSubject };
