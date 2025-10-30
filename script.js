document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authContainer = document.getElementById('auth-container');
    const contentContainer = document.getElementById('content-container');
    const authTokenInput = document.getElementById('github-token');
    const authRepoInput = document.getElementById('github-repo');
    const authButton = document.getElementById('auth-button');
    const createFolderButton = document.getElementById('create-folder-button');
    const newFolderNameInput = document.getElementById('new-folder-name');
    const uploadFileButton = document.getElementById('upload-file-button');
    const fileUploadInput = document.getElementById('file-upload-input');
    const refreshButton = document.getElementById('refresh-button');
    const currentFolderSpan = document.getElementById('current-folder');
    const folderSearchInput = document.getElementById('folder-search');
    const fileSearchInput = document.getElementById('file-search');
    const selectedFilesContainer = document.getElementById('selected-files-container');
    const toastContainer = document.getElementById('toast-container');
    
    // Modal Elements
    const renameFolderModal = document.getElementById('rename-folder-modal');
    const deleteModal = document.getElementById('delete-modal');
    const newFolderNameInputModal = document.getElementById('new-folder-name-input');
    const folderToRenamePath = document.getElementById('folder-to-rename-path');
    const confirmRename = document.getElementById('confirm-rename');
    const cancelRename = document.getElementById('cancel-rename');
    const confirmDelete = document.getElementById('confirm-delete');
    const cancelDelete = document.getElementById('cancel-delete');
    const deleteMessage = document.getElementById('delete-message');
    const itemToDeletePath = document.getElementById('item-to-delete-path');
    const itemToDeleteSha = document.getElementById('item-to-delete-sha');
    const itemToDeleteType = document.getElementById('item-to-delete-type');

    // State
    let githubToken = localStorage.getItem('githubToken') || '';
    let githubRepo = localStorage.getItem('githubRepo') || '';
    let currentFolder = '';

    // Initialize
    authTokenInput.value = githubToken;
    authRepoInput.value = githubRepo;

    if (githubToken && githubRepo) {
        authContainer.style.display = 'none';
        contentContainer.style.display = 'block';
        getRepoContents();
    }

    // Event Listeners
    authButton.addEventListener('click', authenticate);
    createFolderButton.addEventListener('click', createFolderHandler);
    uploadFileButton.addEventListener('click', uploadFileHandler);
    fileUploadInput.addEventListener('change', displaySelectedFiles);
    refreshButton.addEventListener('click', () => {
    try {
        if (typeof getRepoContents === 'function') {
            refreshButton.disabled = true;
            refreshButton.textContent = 'Refreshing...';
            getRepoContents(currentFolder);
            setTimeout(() => {
                refreshButton.disabled = false;
                refreshButton.textContent = 'Refresh';
            }, 1000);
        } else {
            window.location.reload();
        }
    } catch (err) {
        console.error("Error refreshing, reloading instead:", err);
        window.location.reload();
    }
});
    folderSearchInput.addEventListener('input', () => filterAndDisplay('folder'));
    fileSearchInput.addEventListener('input', () => filterAndDisplay('file'));
    
    // Modal Event Listeners
    confirmRename.addEventListener('click', renameFolderHandler);
    cancelRename.addEventListener('click', () => closeModal(renameFolderModal));
    confirmDelete.addEventListener('click', deleteItemHandler);
    cancelDelete.addEventListener('click', () => closeModal(deleteModal));
    
    // Close modals when clicking on X
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === renameFolderModal) {
            closeModal(renameFolderModal);
        }
        if (event.target === deleteModal) {
            closeModal(deleteModal);
        }
    });

    // Functions
    function authenticate() {
        githubToken = authTokenInput.value;
        githubRepo = authRepoInput.value;

        if (githubToken && githubRepo) {
            localStorage.setItem('githubToken', githubToken);
            localStorage.setItem('githubRepo', githubRepo);

            authContainer.style.display = 'none';
            contentContainer.style.display = 'block';
            getRepoContents();
        } else {
            alert('Please provide both a GitHub token and repository.');
        }
    }

    function createFolderHandler() {
        const newFolderName = newFolderNameInput.value;
        if (newFolderName) {
            createFolder(newFolderName);
        } else {
            alert('Please enter a folder name.');
        }
    }

    function uploadFileHandler() {
        const files = fileUploadInput.files;
        if (files.length > 0) {
            uploadFileButton.disabled = true;
            uploadFileButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

            let filesUploaded = 0;
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = function() {
                    const base64Content = reader.result.split(',')[1];
                    uploadFile(file.name, base64Content).then(() => {
                        filesUploaded++;
                        if (filesUploaded === files.length) {
                            selectedFilesContainer.textContent = ''; // Clear the displayed file names
                            uploadFileButton.disabled = false;
                            uploadFileButton.innerHTML = '<i class="fas fa-upload"></i> Upload';
                        }
                    });
                }
                reader.readAsDataURL(file);
            });
        } else {
            alert('Please select files to upload.');
        }
    }

    function displaySelectedFiles() {
        const files = fileUploadInput.files;
        if (files.length > 0) {
            let fileNames = Array.from(files).map(file => file.name).join(', ');
            selectedFilesContainer.textContent = `${fileNames}`;
        } else {
            selectedFilesContainer.textContent = '';
        }
    }

    function getRepoContents(path = '') {
        currentFolder = path;
        currentFolderSpan.textContent = `/${path}`;
        const url = `https://api.github.com/repos/${githubRepo}/contents/${path}`;

        fetch(url, {
            headers: {
                'Authorization': `token ${githubToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                displayContents(data);
            }
            else {
                console.error('Error fetching repository contents:', data);
                if (data.message === 'Bad credentials') {
                    alert('Invalid GitHub token. Please check your token and try again.');
                }
            }
        })
        .catch(error => {
            console.error('Error fetching repository contents:', error);
        });
    }

    function displayContents(contents) {
        const folderList = document.getElementById('folder-list');
        const fileList = document.getElementById('file-list');

        folderList.innerHTML = '';
        fileList.innerHTML = '';

        // Add parent folder navigation if not in root
        if (currentFolder !== '') {
            const parentFolder = currentFolder.substring(0, currentFolder.lastIndexOf('/'));
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <a class="folder-link" data-path="${parentFolder}">
                    <i class="fas fa-level-up-alt"></i>
                    <span>.. (Parent Directory)</span>
                </a>
            `;
            listItem.addEventListener('click', (e) => {
                e.preventDefault();
                getRepoContents(parentFolder);
            });
            folderList.appendChild(listItem);
        }

        const folders = contents.filter(item => item.type === 'dir');
        const files = contents.filter(item => item.type === 'file' && item.name !== '.gitkeep');

        // Update counts
        document.getElementById('folder-count').textContent = folders.length;
        document.getElementById('file-count').textContent = files.length;

        // Display folders
        if (folders.length === 0 && currentFolder === '') {
            folderList.innerHTML = `
                <li class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No folders found</p>
                    <p class="empty-state-subtitle">Create your first folder to get started</p>
                </li>
            `;
        }
        else {
            folders.forEach(folder => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <a class="folder-link" data-path="${folder.path}">
                        <i class="fas fa-folder"></i>
                        <span>${folder.name}</span>
                    </a>
                    <div class="button-container">
                        <button class="btn-icon btn-rename" title="Rename Folder">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" title="Delete Folder">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                // Folder click to navigate
                listItem.querySelector('.folder-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    getRepoContents(folder.path);
                });
                
                // Rename button
                listItem.querySelector('.btn-rename').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openRenameFolderModal(folder.path, folder.name);
                });
                
                // Delete button
                listItem.querySelector('.btn-delete').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openDeleteModal(folder.path, '', 'folder', folder.name);
                });
                
                folderList.appendChild(listItem);
            });
        }

        // Display files
        if (files.length === 0) {
            fileList.innerHTML = `
                <li class="empty-state">
                    <i class="fas fa-file"></i>
                    <p>No files found</p>
                    <p class="empty-state-subtitle">Upload your first file to get started</p>
                </li>
            `;
        }
        else {
            files.forEach(file => {
                const fileExtension = file.name.split('.').pop().toLowerCase();
                const fileType = getFileType(fileExtension);
                
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <div class="file-item">
                        <div class="file-icon ${fileType}">
                            <i class="${getFileIcon(fileType)}"></i>
                        </div>
                        <div class="file-info">
                            <div class="file-name">${file.name}</div>
                            <div class="file-meta">${formatFileSize(file.size)}</div>
                        </div>
                    </div>
                    <div class="button-container">
                        <button class="btn-icon btn-copy" title="Copy Link">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn-icon btn-download" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-icon btn-delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                // Copy link button
                listItem.querySelector('.btn-copy').addEventListener('click', (e) => {
                    const button = e.currentTarget;
                    const url = `https://dpgaire.github.io/image-server/${file.path}`;
                    navigator.clipboard.writeText(url).then(() => {
                        button.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => {
                            button.innerHTML = '<i class="fas fa-copy"></i>';
                        }, 2000);
                    });
                });

                // Download button
                listItem.querySelector('.btn-download').addEventListener('click', () => {
                    window.open(file.download_url, '_blank');
                });
                
                // Delete button
                listItem.querySelector('.btn-delete').addEventListener('click', () => {
                    openDeleteModal(file.path, file.sha, 'file', file.name);
                });
                
                fileList.appendChild(listItem);
            });
        }
    }

    function getFileType(extension) {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        const pdfExtensions = ['pdf'];
        const documentExtensions = ['doc', 'docx', 'txt', 'rtf', 'odt'];
        
        if (imageExtensions.includes(extension)) return 'image';
        if (pdfExtensions.includes(extension)) return 'pdf';
        if (documentExtensions.includes(extension)) return 'document';
        return 'other';
    }

    function getFileIcon(fileType) {
        switch(fileType) {
            case 'image': return 'fas fa-image';
            case 'pdf': return 'fas fa-file-pdf';
            case 'document': return 'fas fa-file-alt';
            default: return 'fas fa-file';
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function createFolder(folderName) {
        createFolderButton.disabled = true;
        createFolderButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

        const path = `${currentFolder ? currentFolder + '/' : ''}${folderName}/.gitkeep`;
        const url = `https://api.github.com/repos/${githubRepo}/contents/${path}`;

        const data = {
            message: `Create folder ${folderName}`,
            content: btoa('') // Empty content for .gitkeep file
        };

        fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.content) {
                getRepoContents(currentFolder);
                newFolderNameInput.value = '';
                showToast(`Folder '${folderName}' created successfully!`);
            }
            else {
                console.error('Error creating folder:', data);
                alert('Error creating folder: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error creating folder:', error);
            alert('Error creating folder: ' + error.message);
        })
        .finally(() => {
            createFolderButton.disabled = false;
            createFolderButton.innerHTML = '<i class="fas fa-plus"></i> Create';
        });
    }

    function uploadFile(fileName, base64Content) {
        const path = `${currentFolder ? currentFolder + '/' : ''}${fileName}`;
        const url = `https://api.github.com/repos/${githubRepo}/contents/${path}`;

        // First, try to get the file to see if it exists
        return fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `token ${githubToken}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            else {
                return null;
            }
        })
        .then(existingFile => {
            const data = {
                message: `Upload file ${fileName}`,
                content: base64Content
            };

            // If file exists, include the SHA for update
            if (existingFile) {
                data.sha = existingFile.sha;
                data.message = `Update file ${fileName}`;
            }

            return fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        })
        .then(response => response.json())
        .then(data => {
            if (data.content) {
                getRepoContents(currentFolder);
                showToast(`File '${fileName}' uploaded successfully!`);
            }
            else {
                console.error('Error uploading file:', data);
                alert('Error uploading file: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error uploading file:', error);
            alert('Error uploading file: ' + error.message);
        });
    }

    async function deleteFile(path, sha, norefresh = false) {
        console.log(`Deleting file: ${path}`);
        const url = `https://api.github.com/repos/${githubRepo}/contents/${path}`;

        const data = {
            message: `Delete file ${path}`,
            sha: sha
        };

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!norefresh) {
            getRepoContents(currentFolder);
        }

        console.log(`File deleted: ${path}`);
        return response.json();
    }

    async function deleteFolder(path) {
        console.log(`Deleting folder: ${path}`);
        const url = `https://api.github.com/repos/${githubRepo}/contents/${path}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${githubToken}`
            }
        });

        const contents = await response.json();

        if (Array.isArray(contents)) {
            for (const item of contents) {
                if (item.type === 'dir') {
                    await deleteFolder(item.path);
                } else {
                    await deleteFile(item.path, item.sha, true);
                }
            }
        }
        getRepoContents(currentFolder);
        console.log(`Folder deleted: ${path}`);
    }

    function renameFolderHandler() {
        const newName = newFolderNameInputModal.value;
        const oldPath = folderToRenamePath.value;
        
        if (!newName) {
            alert('Please enter a new folder name');
            return;
        }

        // Extract the parent path and create new path
        const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
        const newPath = parentPath ? `${parentPath}/${newName}` : newName;
        
        // Close modal first
        closeModal(renameFolderModal);
        
        // Rename operation would require moving all files
        // This is a complex operation with GitHub API
        alert('Folder renaming functionality would require moving all files. This is a complex operation that needs additional implementation.');
        
        // For now, we'll just refresh
        getRepoContents(currentFolder);
    }

    async function deleteItemHandler() {
        const path = itemToDeletePath.value;
        const sha = itemToDeleteSha.value;
        const type = itemToDeleteType.value;
        
        closeModal(deleteModal);
        
        if (type === 'file') {
            deleteFile(path, sha);
        } else if (type === 'folder') {
            await deleteFolder(path);
            alert('Folder deleted successfully.');
        }
    }

    function openRenameFolderModal(path, currentName) {
        folderToRenamePath.value = path;
        newFolderNameInputModal.value = currentName;
        newFolderNameInputModal.focus();
        renameFolderModal.style.display = 'block';
    }

    function openDeleteModal(path, sha, type, name) {
        itemToDeletePath.value = path;
        itemToDeleteSha.value = sha;
        itemToDeleteType.value = type;
        deleteMessage.textContent = `Are you sure you want to delete ${type} "${name}"?`;
        deleteModal.style.display = 'block';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    function filterAndDisplay(type) {
        const searchTerm = (type === 'folder' ? folderSearchInput.value : fileSearchInput.value).toLowerCase();
        const list = document.getElementById(`${type}-list`);
        const items = list.querySelectorAll('li');

        items.forEach(item => {
            // Ignore the parent directory link
            if (item.querySelector('.fa-level-up-alt')) {
                item.style.display = 'flex';
                return;
            }

            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.classList.add('toast');
        toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }
});