const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve the supplied frontend without modifying dist
app.use(express.static(path.join(__dirname, 'dist', 'Frontend')));

// Employee schema and model
const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    position: { type: String, required: true },
    salary: { type: Number, required: true }
});

const Employee = mongoose.model('Employee', employeeSchema);

// Support both routes used by the supplied frontend
const routes = ['/employeelist', '/api/employeelist'];

// GET: Get all employees
app.get(routes, async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch employees' });
    }
});

// GET: Get one employee by ID
app.get(['/employeelist/:id', '/api/employeelist/:id'], async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid employee ID' });
        }

        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch employee' });
    }
});

// POST: Add a new employee
app.post(routes, async (req, res) => {
    try {
        const employee = new Employee({
            name: req.body.name,
            location: req.body.location,
            position: req.body.position,
            salary: req.body.salary
        });

        const savedEmployee = await employee.save();
        res.status(201).json(savedEmployee);
    } catch (error) {
        res.status(400).json({
            message: 'Failed to add employee. Check all fields.',
            error: error.message
        });
    }
});

// PUT: Update an employee
app.put(routes, async (req, res) => {
    try {
        const id = req.body._id || req.body.id;

        if (!id || !mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: 'A valid employee ID is required'
            });
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            id,
            {
                name: req.body.name,
                location: req.body.location,
                position: req.body.position,
                salary: req.body.salary
            },
            { new: true, runValidators: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(updatedEmployee);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update employee' });
    }
});

// DELETE: Delete an employee
app.delete(
    ['/employeelist/:id', '/api/employeelist/:id'],
    async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({ message: 'Invalid employee ID' });
            }

            const deletedEmployee = await Employee.findByIdAndDelete(
                req.params.id
            );

            if (!deletedEmployee) {
                return res.status(404).json({ message: 'Employee not found' });
            }

            res.json({ message: 'Employee deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to delete employee' });
        }
    }
);

// Keep the supplied frontend fallback
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'dist', 'Frontend', 'index.html'));
});

// Connect to MongoDB, then start the server
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB successfully');

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection failed:', error.message);
    });
