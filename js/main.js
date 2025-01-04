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
        
        // 添加渲染优化设置
        graphCanvas.high_quality = true;           // 启用高质量渲染
        graphCanvas.render_shadows = true;         // 启用阴影渲染
        graphCanvas.default_text_font = "Arial";   // 使用清晰的字体
        graphCanvas.node_text_size = 14;           // 设置更大的文字大小
        
        // 修改默认缩放比例
        graphCanvas.ds.scale = 1.5;
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
            
            // 增加节点的默认大小
            this.size = [
                parseInt(nodeConfig.size?.[0] || 280),  // 增加默认宽度
                parseInt(nodeConfig.size?.[1] || 120)   // 增加默认高度
            ];
            
            // 设置更大的字体大小和更清晰的样式
            this.title_text_font = "14px Arial";  // 增加标题字体大小
            this.font_size = 14;                  // 增加普通文本字体大小
            this.title_text_shadow = true;        // 添加文字阴影提高清晰度

            // 其他节点样式设置
            this.bgcolor = "#101013FF";
            this.shape = LiteGraph.ROUND_SHAPE;
            
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
                                    width: 200,           // 增加宽度
                                    height: 30,           // 增加高度
                                    multiline: isMultiline,
                                    disabled: true,
                                    fontSize: 13,         // 设置更大的字体
                                    fontFamily: 'Arial',  // 使用更清晰的字体
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)', // 添加文字阴影
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

        // 检查文件类型
        const fileExtension = file.name.toLowerCase().split('.').pop();
        
        if (fileExtension === 'json') {
            handleJsonFile(file);
        } else if (fileExtension === 'png') {
            handlePngFile(file);
        } else {
            alert('Please select a JSON or PNG file');
        }
    }

    // 处理 JSON 文件
    function handleJsonFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                processWorkflowContent(file.name, content);
            } catch (error) {
                console.error('Error processing JSON:', error);
                alert('Error processing JSON file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    // 处理 PNG 文件
    function handlePngFile(file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const buffer = e.target.result;
                const bytes = new Uint8Array(buffer);
                
                // 查找 PNG 签名
                if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4E || bytes[3] !== 0x47) {
                    throw new Error('Not a valid PNG file');
                }

                let offset = 8; // 跳过 PNG 签名
                let workflow = null;

                // 读取 PNG chunks
                while (offset < bytes.length) {
                    const length = bytes[offset] << 24 | bytes[offset + 1] << 16 | 
                                 bytes[offset + 2] << 8 | bytes[offset + 3];
                    offset += 4;

                    // 获取 chunk 类型
                    const chunkType = String.fromCharCode(
                        bytes[offset], bytes[offset + 1], 
                        bytes[offset + 2], bytes[offset + 3]
                    );
                    offset += 4;

                    // 查找 tEXt chunk
                    if (chunkType === 'tEXt') {
                        let keyEnd = offset;
                        
                        // 查找 null 分隔符
                        while (bytes[keyEnd] !== 0 && keyEnd < offset + length) {
                            keyEnd++;
                        }
                        
                        // 获取键名
                        const key = String.fromCharCode(...bytes.slice(offset, keyEnd));
                        
                        // 获取值
                        const valueStart = keyEnd + 1;
                        const valueEnd = offset + length;
                        const value = new TextDecoder().decode(
                            bytes.slice(valueStart, valueEnd)
                        );

                        // 检查是否是工作流数据
                        if (key === 'workflow' || key === 'parameters') {
                            try {
                                workflow = JSON.parse(value);
                                if (workflow.prompt) {
                                    workflow = workflow.prompt;
                                }
                            } catch (e) {
                                console.log('Failed to parse chunk data:', e);
                            }
                        }
                    }

                    // 移动到下一个 chunk
                    offset += length + 4; // +4 for CRC
                }

                // 如果在 chunks 中没找到工作流，尝试在文件内容中查找
                if (!workflow) {
                    const text = new TextDecoder().decode(buffer);
                    const matches = text.match(/\{"prompt":\s*{.+?}(?=\s*$)/s);
                    if (matches) {
                        try {
                            workflow = JSON.parse(matches[0]);
                        } catch (e) {
                            console.log('Failed to parse text content:', e);
                        }
                    }
                }

                if (workflow) {
                    // 直接使用文件名
                    processWorkflowContent(file.name, JSON.stringify(workflow));
                } else {
                    throw new Error('No workflow data found in the image');
                }

            } catch (error) {
                console.error('Error processing PNG:', error);
                alert('Error extracting workflow from PNG: ' + error.message + 
                      '\nPlease make sure this is a ComfyUI generated image with workflow data.');
            }
        };

        reader.readAsArrayBuffer(file);
    }

    // 处理工作流内容
    function processWorkflowContent(filename, content) {
        try {
            const workflow = JSON.parse(content);
            
            // 添加到历史记录时使用工作流名称
            fileHistory.addFile(filename, content);
            
            // 渲染工作流
            renderWorkflow(workflow);
            
            // 隐藏上传容器，但保持拖放功能
            uploadContainer.style.opacity = '0';
            uploadContainer.style.pointerEvents = 'none';

            // 添加拖放事件监听器
            document.addEventListener('dragenter', function(e) {
                e.preventDefault();
                // 显示上传容器
                uploadContainer.style.opacity = '1';
                uploadContainer.style.pointerEvents = 'auto';
            });

            // 当拖离上传容器时隐藏它
            uploadContainer.addEventListener('dragleave', function(e) {
                if (e.relatedTarget === null || !uploadContainer.contains(e.relatedTarget)) {
                    uploadContainer.style.opacity = '0';
                    uploadContainer.style.pointerEvents = 'none';
                }
            });
            
            // 显示工作流名称
            const filenameDisplay = document.getElementById('filename-display');
            filenameDisplay.textContent = filename;
            filenameDisplay.style.display = 'block';

            // 更新文件列表项的激活状态
            document.querySelectorAll('.file-list-item').forEach(el => {
                if (el.querySelector('.file-name').textContent === filename) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            });
        } catch (error) {
            console.error('Error processing workflow:', error);
            alert('Error processing workflow: ' + error.message);
        }
    }

    // Fit view to content
    function fitToContent() {
        if (!graph || !graphCanvas) return;

        // 找到所有节点的边界
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

        // 添加边距
        const margin = 50;
        minX -= margin;
        maxX += margin;
        minY -= margin;
        maxY += margin;

        // 计算缩放比例
        const width = maxX - minX;
        const height = maxY - minY;
        const scaleX = canvas.width / width;
        const scaleY = canvas.height / height;
        const scale = Math.min(scaleX, scaleY, 1.5); // 增加最大缩放限制到 3

        // 设置画布变换
        graphCanvas.ds.offset[0] = canvas.width / 2 - (minX + maxX) / 2 * scale;
        graphCanvas.ds.offset[1] = canvas.height / 2 - (minY + maxY) / 2 * scale;
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

            // 设置更大的缩放比例
            graphCanvas.ds.scale = 1.5;  // 增加缩放比例

            // Start rendering
            graph.start();
            
            // 调整 fitToContent 中的缩放
            const oldFit = fitToContent;
            fitToContent = function() {
                oldFit();
                graphCanvas.ds.scale = Math.max(graphCanvas.ds.scale, 0.8); // 确保最小缩放比例
            };
            
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
