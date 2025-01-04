document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    const uploadContainer = document.getElementById('upload-container');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.querySelector('.drop-zone');
    let graph = null;
    let graphCanvas = null;

    // Define FileHistory class
    class FileHistory {
        constructor() {
            this.history = this.loadHistory();
        }

        // Load history records
        loadHistory() {
            const history = localStorage.getItem('fileHistory');
            return history ? JSON.parse(history) : {};
        }

        // Add file to history
        addFile(filename, content) {
            this.history[filename] = {
                content,
                timestamp: Date.now()
            };
            this.saveHistory();
            this.updateFileList();
        }

        // Save history records
        saveHistory() {
            localStorage.setItem('fileHistory', JSON.stringify(this.history));
        }

        // Update file list display
        updateFileList() {
            const fileList = document.getElementById('file-list');
            fileList.innerHTML = '';

            const sortedFiles = Object.entries(this.history)
                .sort(([, a], [, b]) => b.timestamp - a.timestamp);

            sortedFiles.forEach(([filename, data]) => {
                const item = document.createElement('div');
                item.className = 'file-list-item';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = filename;
                nameSpan.className = 'file-name';
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '×';
                
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteFile(filename);
                });

                nameSpan.addEventListener('click', () => {
                    this.loadFile(filename, data.content);
                    document.querySelectorAll('.file-list-item').forEach(el => {
                        el.classList.remove('active');
                    });
                    item.classList.add('active');
                });

                item.appendChild(nameSpan);
                item.appendChild(deleteBtn);
                fileList.appendChild(item);
            });
        }

        // Load file
        loadFile(filename, content) {
            try {
                const workflow = JSON.parse(content);
                
                // Display filename
                const filenameDisplay = document.getElementById('filename-display');
                filenameDisplay.textContent = filename;
                filenameDisplay.style.display = 'block';

                // Hide upload container
                const uploadContainer = document.getElementById('upload-container');
                uploadContainer.style.opacity = '0';
                uploadContainer.style.pointerEvents = 'none';

                // Render workflow
                window.renderWorkflow(workflow);

                // Add drag and drop event listeners for new files
                document.addEventListener('dragenter', function(e) {
                    e.preventDefault();
                    // Show upload container
                    uploadContainer.style.opacity = '1';
                    uploadContainer.style.pointerEvents = 'auto';
                });
                
                // Hide upload container when drag leaves
                uploadContainer.addEventListener('dragleave', function(e) {
                    if (e.relatedTarget === null || !uploadContainer.contains(e.relatedTarget)) {
                        uploadContainer.style.opacity = '0';
                        uploadContainer.style.pointerEvents = 'none';
                    }
                });

            } catch (error) {
                console.error('Error loading file:', error);
                alert('Failed to load file: ' + error.message);
            }
        }

        // Delete file
        deleteFile(filename) {
            delete this.history[filename];
            this.saveHistory();
            this.updateFileList();
        }
    }

    // Initialize file history and display list
    const fileHistory = new FileHistory();
    fileHistory.updateFileList();

    // Initialize canvas
    function initCanvas() {
        graph = new LGraph();
        graphCanvas = new LGraphCanvas(canvas, graph);
        
        // Configure canvas
        graphCanvas.background_color = '#1a1a1a';
        graphCanvas.clear_background = true;
        graphCanvas.render_grid = false;
        graphCanvas.render_background_grid = false;
        graphCanvas.render_canvas_border = false;
        graphCanvas.render_connections_border = false;
        graphCanvas.render_selection_border = false;
        graphCanvas.render_subgraph_boundary = false;
        
        // Show connection points
        graphCanvas.show_connection_dots = true;
        graphCanvas.always_render_connection_dots = true;
        
        // Allow basic interactions
        graphCanvas.allow_dragcanvas = true;
        graphCanvas.allow_dragnodes = true;
        graphCanvas.allow_interaction = true;
        graphCanvas.allow_click_selected_node = true;
        
        // Disable editing features
        graphCanvas.allow_searchbox = false;
        graphCanvas.allow_reconnect_links = false;
        graphCanvas.allow_add_node_on_menu = false;
        graphCanvas.allow_connection_clicks = false;
        graphCanvas.allow_add_node_on_connection = false;
        graphCanvas.allow_multi_output_for_connections = false;
        
        // Disable other features
        graphCanvas.node_capturing_mode = false;
        graphCanvas.show_info = false;
        graphCanvas.connecting_node = null;
        graphCanvas.connecting_pos = null;
        
        // Disable all menus
        graphCanvas.getCanvasMenuOptions = () => null;
        graphCanvas.getNodeMenuOptions = () => null;
        graphCanvas.getGroupMenuOptions = () => null;
        graphCanvas.getExtraMenuOptions = () => null;
        graphCanvas.getLinkMenuOptions = () => null;
        graphCanvas.getShowMenuOptions = () => null;
        graphCanvas.allow_contextmenu = false;
        
        // Allow node selection but disable other event handlers
        graphCanvas.processConnectionEvent = () => false;
        graphCanvas.onConnectionCreated = () => false;
        graphCanvas.onConnectionSelect = () => false;
        graphCanvas.onConnectionDrop = () => false;
        graphCanvas.processNodeDblClicked = () => false;
        
        // Remove processNodeSelected disable
        // graphCanvas.processNodeSelected = () => false;
        
        // Set canvas size
        resizeCanvas();
    }

    // Adjust canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (graphCanvas) {
            graphCanvas.resize(canvas.width, canvas.height);
        }
    }

    // Add connection color configuration before ComfyNode class definition
    LiteGraph.LINK_COLORS = {
        "IMAGE": "#64b5f6",
        "MODEL": "#b39ddb",
        "VAE": "#ff6e6e",
        "CLIP": "#ffd500",
        "CONDITIONING": "#ffa931",
        "LATENT": "#ff9cf9",
        "CONTROL_NET": "#00d78d",
        "STRING": "#80CE4CFF",
        "INT": "#29699c",
        "FLOAT": "#9955ff",
        "BOOLEAN": "#ff5599",
        "TUPLE": "#55ff99",
        "LIST": "#4BCA6FFF",
        "MASK": "#5599ff",
        "*": "#99aa99"  // Default color
    };

    // Create base node class
    class ComfyNode {
        constructor() {
            if (LiteGraph.LGraphNode) {
                LiteGraph.LGraphNode.call(this);
            }
            
            this.properties = {};
            this.size = [200, 100];
            this.bgcolor = "#101013FF";
            
            this.inputs = [];
            this.outputs = [];
            this.title_mode = LiteGraph.NORMAL_TITLE;
        }

        configure(nodeConfig) {
            if (!nodeConfig) return;
            
            // Basic property settings
            this.properties = nodeConfig.properties || {};
            this.title = nodeConfig.type || "ComfyNode";
            this.id = nodeConfig.id;
            
            // Special handling for Note nodes
            if (nodeConfig.type === "Note") {
                // Save Note text content
                this.noteText = nodeConfig.widgets_values?.[0] || "";
                
                // Clear all widgets
                this.widgets = [];
                
                // Keep original position and size
                if (nodeConfig.pos) {
                    this.pos = nodeConfig.pos;
                }
                if (nodeConfig.size) {
                    this.size = [
                        parseInt(nodeConfig.size[0] || nodeConfig.size['0']) || 280,
                        parseInt(nodeConfig.size[1] || nodeConfig.size['1']) || 150
                    ];
                }
                
                this.flags = {
                    no_inputs: true,
                    no_outputs: true
                };

                // Modify click handler to check if click is in text area
                this.onMouseDown = function(e, local_pos) {
                    // Calculate text box area
                    const margin = 10;
                    const boxX = margin;
                    const boxY = margin;
                    const boxWidth = this.size[0] - margin * 2;
                    const boxHeight = this.size[1] - margin * 2;

                    // Check if click is within text box area
                    if (local_pos[0] >= boxX && 
                        local_pos[0] <= boxX + boxWidth && 
                        local_pos[1] >= boxY && 
                        local_pos[1] <= boxY + boxHeight && 
                        e.button === 0) { // Left click
                        
                        // Create temporary textarea
                        const textarea = document.createElement('textarea');
                        textarea.value = this.noteText;
                        document.body.appendChild(textarea);
                        textarea.select();
                        
                        try {
                            // Try to copy text
                            document.execCommand('copy');
                            // Show notification
                            const notification = document.createElement('div');
                            notification.textContent = 'Text copied to clipboard';
                            notification.style.cssText = `
                                position: fixed;
                                top: 20px;
                                left: 50%;
                                transform: translateX(-50%);
                                background: rgba(0, 0, 0, 0.8);
                                color: white;
                                padding: 8px 16px;
                                border-radius: 4px;
                                z-index: 10000;
                                font-family: Arial, sans-serif;
                            `;
                            document.body.appendChild(notification);
                            
                            // Remove notification after 2 seconds
                            setTimeout(() => {
                                notification.remove();
                            }, 2000);
                        } catch (err) {
                            console.error('Copy failed:', err);
                        }
                        
                        // Remove temporary textarea
                        document.body.removeChild(textarea);
                        return true; // Prevent event bubbling
                    }
                    return false; // Allow node dragging
                };

                // Modify mouse hover handler to only show pointer in text area
                this.onMouseOver = function(e, local_pos) {
                    const margin = 10;
                    const boxX = margin;
                    const boxY = margin;
                    const boxWidth = this.size[0] - margin * 2;
                    const boxHeight = this.size[1] - margin * 2;

                    if (local_pos[0] >= boxX && 
                        local_pos[0] <= boxX + boxWidth && 
                        local_pos[1] >= boxY && 
                        local_pos[1] <= boxY + boxHeight) {
                        document.body.style.cursor = 'pointer';
                    } else {
                        document.body.style.cursor = 'default';
                    }
                };
                
                this.onMouseOut = function() {
                    document.body.style.cursor = 'default';
                };

                // Original drawing method
                this.onDrawForeground = function(ctx) {
                    if (!this.noteText) return;
                    
                    // Set text box style
                    ctx.fillStyle = "#43434394";
                    ctx.strokeStyle = "#666";
                    ctx.lineWidth = 1;
                    
                    // Draw text box background
                    const margin = 10;
                    const boxWidth = this.size[0] - margin * 2;
                    const boxHeight = this.size[1] - margin * 2;
                    ctx.beginPath();
                    ctx.roundRect(margin, margin, boxWidth, boxHeight, 4);
                    ctx.fill();
                    ctx.stroke();
                    
                    // Set text style
                    ctx.fillStyle = "#fff";
                    ctx.font = "14px monospace";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "top";
                    
                    // Text rendering parameters
                    const padding = 15;
                    const maxWidth = boxWidth - padding * 2;
                    const lineHeight = 18;
                    
                    // Handle text auto-wrap
                    const text = this.noteText;
                    let currentLine = '';
                    let y = margin + padding;
                    
                    // Iterate through characters for precise line breaks
                    for (let i = 0; i < text.length; i++) {
                        const char = text[i];
                        
                        // Handle line breaks
                        if (char === '\n') {
                            ctx.fillText(currentLine, margin + padding, y);
                            currentLine = '';
                            y += lineHeight;
                            continue;
                        }
                        
                        // Test width after adding current character
                        const testLine = currentLine + char;
                        const metrics = ctx.measureText(testLine);
                        
                        if (metrics.width > maxWidth) {
                            // If it's a space, just break line
                            if (char === ' ') {
                                ctx.fillText(currentLine, margin + padding, y);
                                currentLine = '';
                                y += lineHeight;
                            } else {
                                // For non-space characters, check if we can break at previous space
                                const lastSpaceIndex = currentLine.lastIndexOf(' ');
                                if (lastSpaceIndex !== -1) {
                                    // Break line at last space
                                    ctx.fillText(currentLine.substring(0, lastSpaceIndex), margin + padding, y);
                                    currentLine = currentLine.substring(lastSpaceIndex + 1) + char;
                                } else {
                                    // No space found, force break
                                    ctx.fillText(currentLine, margin + padding, y);
                                    currentLine = char;
                                }
                                y += lineHeight;
                            }
                        } else {
                            currentLine += char;
                        }
                    }
                    
                    // Draw the last line
                    if (currentLine) {
                        ctx.fillText(currentLine, margin + padding, y);
                    }
                };
            } else {
                try {
                    // Set node size and position
                    if (nodeConfig.size) {
                        this.size = [
                            parseInt(nodeConfig.size[0] || nodeConfig.size['0']) || 200, 
                            parseInt(nodeConfig.size[1] || nodeConfig.size['1']) || 100
                        ];
                    }
                    if (nodeConfig.pos) {
                        this.pos = nodeConfig.pos;
                    }

                    // Set input ports
                    if (Array.isArray(nodeConfig.inputs)) {
                        nodeConfig.inputs.forEach((input) => {
                            if (!input) return;
                            const type = (input.type || "*").toUpperCase();
                            const name = input.name || "";
                            const label = input.label || name;
                            const slot = this.addInput(label, type);
                            if (slot) {
                                slot.type = type;
                                slot.link_type = type;
                                const slotColor = LiteGraph.LINK_COLORS[type] || LiteGraph.LINK_COLORS["*"];
                                slot.color = slotColor;
                                slot.color_on = slotColor;
                                slot.color_off = slotColor;
                                if (input.link !== null) {
                                    slot.link = input.link;
                                }
                            }
                        });
                    }

                    // Set output ports
                    if (nodeConfig.outputs) {
                        nodeConfig.outputs.forEach((output) => {
                            const type = (output.type || "*").toUpperCase();
                            const name = output.name || "";
                            const label = output.label || name;
                            const slot = this.addOutput(label, type);
                            if (slot) {
                                slot.type = type;
                                slot.link_type = type;
                                const slotColor = LiteGraph.LINK_COLORS[type] || LiteGraph.LINK_COLORS["*"];
                                slot.color = slotColor;
                                slot.color_on = slotColor;
                                slot.color_off = slotColor;
                                if (output.links) {
                                    slot.links = output.links;
                                }
                            }
                        });
                    }

                    // Set parameter widgets
                    if (nodeConfig.widgets_values) {
                        const values = Array.isArray(nodeConfig.widgets_values) ? 
                            nodeConfig.widgets_values : [nodeConfig.widgets_values];

                        values.forEach((value, index) => {
                            if (value !== null && value !== undefined && value !== "") {
                                const isMultiline = Array.isArray(value) || 
                                                  (typeof value === 'string' && value.includes('\n')) || 
                                                  (typeof value === 'string' && value.length > 50);
                                
                                this.addWidget("text", "", value, (v) => {
                                    this.properties[`param_${index}`] = v;
                                }, {
                                    width: 180,
                                    multiline: isMultiline,
                                    disabled: true,
                                    fontSize: 12
                                });
                            }
                        });
                    }

                } catch (error) {
                    console.error("Error configuring node:", error);
                    // Ensure node has basic configuration
                    this.size = this.size || [200, 100];
                    this.pos = this.pos || [0, 0];
                }
            }
        }

        getConnectionColor(slot) {
            if (!slot || !slot.type) {
                return LiteGraph.LINK_COLORS["*"] || "#999";  // Use default color
            }
            const type = slot.type.toUpperCase();
            return LiteGraph.LINK_COLORS[type] || LiteGraph.LINK_COLORS["*"] || "#999";
        }

        onConnectionsChange(type, slot, connected, link_info) {
            if (!this.graph || !link_info) return;

            const link = this.graph.links[link_info.id];
            if (!link) return;

            // Set connection color
            const slotType = type === LiteGraph.INPUT 
                ? this.inputs[slot]?.type 
                : this.outputs[slot]?.type;
            
            if (slotType) {
                link.color = LiteGraph.LINK_COLORS[slotType] || LiteGraph.LINK_COLORS["*"];
            }

            // Update connection status
            if (type === LiteGraph.INPUT) {
                this.inputs[slot].link = connected ? link_info.id : null;
            } else {
                if (!this.outputs[slot].links) {
                    this.outputs[slot].links = [];
                }
                if (connected) {
                    this.outputs[slot].links.push(link_info.id);
                } else {
                    const idx = this.outputs[slot].links.indexOf(link_info.id);
                    if (idx !== -1) {
                        this.outputs[slot].links.splice(idx, 1);
                    }
                }
            }
        }

        // Add connection validation
        isValidConnection(type, slot, targetNode, targetSlot) {
            if (!targetNode) return false;

            const sourceType = type === LiteGraph.INPUT 
                ? targetNode.outputs[targetSlot]?.type 
                : this.outputs[slot]?.type;
            const targetType = type === LiteGraph.INPUT 
                ? this.inputs[slot]?.type 
                : targetNode.inputs[targetSlot]?.type;

            return sourceType === targetType || 
                   sourceType === "*" || 
                   targetType === "*";
        }

        // Add node state save functionality
        saveState() {
            return {
                id: this.id,
                pos: this.pos,
                size: this.size,
                properties: this.properties,
                widgets_values: this.widgets_values
            };
        }

        // Add node state load functionality
        loadState(state) {
            if (state) {
                this.pos = state.pos;
                this.size = state.size;
                this.properties = state.properties;
                this.widgets_values = state.widgets_values;
            }
        }
    }

    // Set prototype chain correctly - moved outside class definition
    ComfyNode.prototype = Object.create(LiteGraph.LGraphNode.prototype);
    ComfyNode.prototype.constructor = ComfyNode;

    // Register all node types
    function registerNodeTypes() {
        if (!LiteGraph.registered_node_types["comfy/base"]) {
            ComfyNode.title = "Comfy Node";
            ComfyNode.desc = "Base node for ComfyUI";
            LiteGraph.registerNodeType("comfy/base", ComfyNode);
        }
    }

    // Prevent default drag and drop behavior
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, { passive: false });
        dropZone.addEventListener(eventName, preventDefaults, { passive: false });
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Handle drag and drop visual effects
    dropZone.addEventListener('dragenter', highlight);
    dropZone.addEventListener('dragover', highlight);
    dropZone.addEventListener('dragleave', unhighlight);
    dropZone.addEventListener('drop', function(e) {
        unhighlight(e);
        handleDrop(e);
    });

    function highlight(e) {
        preventDefaults(e);
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        preventDefaults(e);
        dropZone.classList.remove('drag-over');
    }

    // Handle file drop
    function handleDrop(e) {
        preventDefaults(e);
        console.log('File dropped');

        const dt = e.dataTransfer;
        if (!dt) {
            console.error('DataTransfer not available');
            return;
        }

        const files = dt.files;
        console.log('Dropped files:', files);
        handleFiles(files);
    }

    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        console.log('File selected via input');
        handleFiles(this.files);
    });

    // Handle files
    function handleFiles(files) {
        if (!files || !files.length) {
            console.log('No files provided');
            return;
        }

        const file = files[0];
        console.log('Processing file:', file.name);

        if (!file.name.toLowerCase().endsWith('.json')) {
            alert('Please select a JSON file');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                const workflow = JSON.parse(content);
                
                // Add to history
                fileHistory.addFile(file.name, content);
                
                // Render workflow
                renderWorkflow(workflow);
                
                // Hide upload container but keep it visible
                uploadContainer.style.opacity = '0';
                uploadContainer.style.pointerEvents = 'none';
                
                // Display filename
                const filenameDisplay = document.getElementById('filename-display');
                filenameDisplay.textContent = file.name;
                filenameDisplay.style.display = 'block';

                // Update file list item active state
                document.querySelectorAll('.file-list-item').forEach(el => {
                    if (el.querySelector('.file-name').textContent === file.name) {
                        el.classList.add('active');
                    } else {
                        el.classList.remove('active');
                    }
                });

                // Add drag and drop event listeners for new files
                document.addEventListener('dragenter', function(e) {
                    e.preventDefault();
                    // Show upload container
                    uploadContainer.style.opacity = '1';
                    uploadContainer.style.pointerEvents = 'auto';
                });
                
                // Hide upload container when drag leaves
                uploadContainer.addEventListener('dragleave', function(e) {
                    if (e.relatedTarget === null || !uploadContainer.contains(e.relatedTarget)) {
                        uploadContainer.style.opacity = '0';
                        uploadContainer.style.pointerEvents = 'none';
                    }
                });

            } catch (error) {
                console.error('Error processing file:', error);
                alert('Failed to parse file: ' + error.message);
            }
        };

        reader.onerror = function(error) {
            console.error('File reading error:', error);
            alert('Error reading file');
        };

        reader.readAsText(file);
    }

    // Fit view to content
    function fitToContent() {
        if (!graph || !graphCanvas) return;

        // Find boundaries of all nodes
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (const node of graph._nodes) {
            const x = node.pos[0];
            const y = node.pos[1];
            const width = node.size[0];
            const height = node.size[1];

            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x + width);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y + height);
        }

        if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
            return;
        }

        // Add margin
        const margin = 50;
        minX -= margin;
        maxX += margin;
        minY -= margin;
        maxY += margin;

        // Calculate scale
        const width = maxX - minX;
        const height = maxY - minY;
        const scaleX = canvas.width / width;
        const scaleY = canvas.height / height;
        const scale = Math.min(scaleX, scaleY, 1); // Limit max scale to 1

        // Calculate center position
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Set canvas transform
        graphCanvas.ds.offset[0] = canvas.width / 2 - centerX * scale;
        graphCanvas.ds.offset[1] = canvas.height / 2 - centerY * scale;
        graphCanvas.ds.scale = scale;
    }

    // Make renderWorkflow available globally
    window.renderWorkflow = function(workflow) {
        try {
            if (!graph) {
                initCanvas();
            }

            // Register node types
            registerNodeTypes();

            // Clear existing content
            graph.clear();

            // Create node mapping
            const nodeMap = new Map();

            // Process nodes
            workflow.nodes.forEach((nodeConfig) => {
                const node = LiteGraph.createNode("comfy/base");
                node.configure(nodeConfig);
                nodeMap.set(nodeConfig.id, node);
                graph.add(node);
            });

            // Process groups
            if (workflow.groups && Array.isArray(workflow.groups)) {
                workflow.groups.forEach(groupData => {
                    const group = new LiteGraph.LGraphGroup();
                    group.configure({
                        title: groupData.title || "Group",
                        bounding: groupData.bounding,
                        color: groupData.color || "#A88",
                        font_size: groupData.font_size || "24",
                        show_title: true
                    });
                    graph.add(group);
                });
            }

            // Set graph ID counters
            graph.last_node_id = Math.max(workflow.last_node_id || 0, ...Array.from(nodeMap.keys()));
            graph.last_link_id = workflow.last_link_id || 0;

            // Create connections
            if (workflow.links) {
                workflow.links.forEach((link) => {
                    try {
                        const [linkId, originNodeId, originSlot, targetNodeId, targetSlot] = link;
                        
                        const originNode = nodeMap.get(originNodeId);
                        const targetNode = nodeMap.get(targetNodeId);
                        
                        if (!originNode || !targetNode) return;

                        const output = originNode.outputs[originSlot];
                        const input = targetNode.inputs[targetSlot];

                        if (!output || !input) return;

                        const linkType = output.type || input.type || "*";
                        output.type = input.type = linkType;

                        const connection = {
                            id: linkId,
                            type: linkType,
                            origin_id: originNodeId,
                            origin_slot: originSlot,
                            target_id: targetNodeId,
                            target_slot: targetSlot,
                            color: LiteGraph.LINK_COLORS[linkType] || LiteGraph.LINK_COLORS["*"]
                        };

                        if (!output.links) output.links = [];
                        output.links.push(linkId);
                        input.link = linkId;

                        graph.links[linkId] = connection;

                        originNode.onConnectionsChange?.(LiteGraph.OUTPUT, originSlot, true, connection);
                        targetNode.onConnectionsChange?.(LiteGraph.INPUT, targetSlot, true, connection);
                    } catch (error) {
                        console.error('Error creating connection:', error);
                    }
                });
            }

            // Configure canvas connection style
            graphCanvas.connections_width = 3;
            graphCanvas.connections_shadow = false;
            graphCanvas.render_curved_connections = true;
            graphCanvas.render_connection_arrows = false;
            graphCanvas.render_connections_border = false;

            // Start rendering
            graph.start();
            fitToContent();

        } catch (error) {
            console.error('Error rendering workflow:', error);
            alert('Error rendering workflow: ' + error.message);
        }
    };

    // Listen for window resize
    window.addEventListener('resize', resizeCanvas);

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            // Display filename
            const filenameDisplay = document.getElementById('filename-display');
            filenameDisplay.textContent = file.name;
            filenameDisplay.style.display = 'block';
            
            // Other existing file handling code...
        };
        reader.readAsText(file);
    }

    // Sidebar collapse functionality
    const sidebar = document.querySelector('.sidebar');
    const collapseBtn = document.querySelector('.sidebar-collapse-btn');

    collapseBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}); 
