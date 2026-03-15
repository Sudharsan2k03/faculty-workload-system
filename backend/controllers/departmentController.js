const Department = require('../models/Department');
const logActivity = require('../utils/logActivity');

// Get all departments
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a department
exports.createDepartment = async (req, res) => {
  const { departmentId, name, description } = req.body;
  try {
    const existingDept = await Department.findOne({ $or: [{ departmentId }, { name }] });
    if (existingDept) return res.status(400).json({ message: 'Department ID or Name already exists' });

    const newDepartment = new Department({ departmentId, name, description });
    await newDepartment.save();
    await logActivity('Department Added', `"${name}" department created`, 'Department');
    res.status(201).json(newDepartment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a department
exports.updateDepartment = async (req, res) => {
  const { departmentId, name, description } = req.body;
  try {
    const existingDept = await Department.findOne({
      _id: { $ne: req.params.id },
      $or: [{ departmentId }, { name }]
    });

    if (existingDept) {
      return res.status(400).json({ message: 'Department ID or Name already exists in another record' });
    }

    const updatedDept = await Department.findByIdAndUpdate(
      req.params.id,
      { departmentId, name, description },
      { new: true }
    );
    await logActivity('Department Updated', `"${name}" department details updated`, 'Department');
    res.json(updatedDept);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a department
exports.deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    await Department.findByIdAndDelete(req.params.id);
    await logActivity('Department Deleted', `"${dept.name}" department removed`, 'Department');
    res.json({ message: 'Department removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
