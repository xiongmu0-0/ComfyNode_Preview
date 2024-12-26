[中文说明](https://github.com/xiongmu0-0/ComfyNode_Preview/blob/main/READMECN.md)

# ComfyNode Preview

ComfyNode Preview is a web-based viewer for ComfyUI workflows that allows users to visualize and explore workflow configurations in an interactive graph interface.

## Features

- **Drag & Drop Support**: Easily load workflow files by dragging and dropping JSON files onto the interface
- **File History**: Keep track of recently opened workflows with a collapsible sidebar
- **Interactive Graph View**: 
  - View nodes and their connections in a clear, visual format
  - Pan and zoom functionality to explore large workflows
  - Auto-fit view to show all nodes
  - Color-coded connections based on data types
- **Responsive Design**: Automatically adjusts to window size changes
- **Dark Theme**: Eye-friendly dark interface optimized for long viewing sessions

## Usage

1. **Loading Workflows**:
   - Drag and drop a ComfyUI workflow JSON file onto the interface
   - Click to select a file from your system
   - Click on a file from the history sidebar

2. **Navigation**:
   - Pan: Click and drag on empty space
   - Select nodes: Click on nodes

3. **History Management**:
   - Recently opened files appear in the sidebar
   - Click on a file name to reload it
   - Use the delete button (×) to remove items from history
   - Collapse/expand the sidebar using the arrow button

## Technical Details

- Built with vanilla JavaScript
- Uses LiteGraph.js for graph visualization
- Local storage for file history persistence
- Supports all ComfyUI node types and connection types
- Color-coded connections for different data types

## Browser Support

Works in modern browsers that support:
- ES6+ JavaScript
- HTML5 File API
- Local Storage
- Canvas API

## Getting Started

1. Clone the repository
2. Open `index.html` in a web browser
3. Drag and drop a ComfyUI workflow JSON file to start viewing

No build process or server required - runs entirely in the browser!
