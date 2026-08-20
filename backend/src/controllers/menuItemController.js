//201 // created successfully
//200 // fetched, updated, or deleted successfully
//404 // item not found
//500 // server/database error
//400 // bad user input
const menuItem = require("../models/menuItem");



const createMenuItem = async (req, res) => {
  try {
    const createItem = await menuItem.create(req.body);
    res.status(201).json(createItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMenuItems = async (req, res) => {
  try {
    const getItems = await menuItem.find();
    res.status(200).json(getItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMenuItem = async (req, res) => {
  try {
    const getItem = await menuItem.findById(req.params.id);

    if (!getItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.status(200).json(getItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const updateItem = await menuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updateItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.status(200).json(updateItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const deleteItem = await menuItem.findByIdAndDelete(req.params.id);

    if (!deleteItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// menuItemController.js
const searchMenuItems = async (req, res) => {
  try {
    const { q } = req.query;

    const items = await MenuItem.find({
      name: { $regex: q, $options: "i" },
    });

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createMenuItem,
  getMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
};