document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('auth-container');
    const contentContainer = document.getElementById('content-container');
    const authTokenInput = document.getElementById('github-token');
    const authRepoInput = document.getElementById('github-repo');
    const authButton = document.getElementById('auth-button');
    const createFolderButton = document.getElementById('create-folder-button');
    const newFolderNameInput = document.getElementById('new-folder-name');
    const uploadImageButton = document.getElementById('upload-image-button');
    const imageUploadInput = document.getElementById('image-upload-input');
    const currentFolderH3 = document.getElementById('current-folder');

    let githubToken = localStorage.getItem('githubToken') || '';
    let githubRepo = localStorage.getItem('githubRepo') || '';
    let currentFolder = '';

    authTokenInput.value = githubToken;
    authRepoInput.value = githubRepo;

    if (githubToken && githubRepo) {
        authContainer.style.display = 'none';
        contentContainer.style.display = 'block';
        getRepoContents();
    }

    authButton.addEventListener('click', () => {
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
    });

    createFolderButton.addEventListener('click', () => {
        const newFolderName = newFolderNameInput.value;
        if (newFolderName) {
            createFolder(newFolderName);
        } else {
            alert('Please enter a folder name.');
        }
    });

    uploadImageButton.addEventListener('click', () => {
        const file = imageUploadInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = function() {
                const base64Content = reader.result.split(',')[1];
                uploadImage(file.name, base64Content);
            }
            reader.readAsDataURL(file);
        } else {
            alert('Please select an image to upload.');
        }
    });

    function getRepoContents(path = '') {
        currentFolder = path;
        currentFolderH3.textContent = `Current Folder: /${path}`;
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
            } else {
                console.error('Error fetching repository contents:', data);
            }
        })
        .catch(error => {
            console.error('Error fetching repository contents:', error);
        });
    }

    function displayContents(contents) {
        const folderList = document.getElementById('folder-list');
        const imageList = document.getElementById('image-list');

        folderList.innerHTML = '';
        imageList.innerHTML = '';

        if (currentFolder !== '') {
            const parentFolder = currentFolder.substring(0, currentFolder.lastIndexOf('/'));
            const listItem = document.createElement('li');
            listItem.innerHTML = `<a href="#" data-path="${parentFolder}">.. (Parent)</a>`;
            listItem.addEventListener('click', (e) => {
                e.preventDefault();
                getRepoContents(parentFolder);
            });
            folderList.appendChild(listItem);
        }

        contents.forEach(item => {
            if (item.type === 'dir') {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<a href="#" data-path="${item.path}">${item.name}</a>`;
                listItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    getRepoContents(item.path);
                });
                folderList.appendChild(listItem);
            } else if (item.type === 'file' && (item.name.endsWith('.png') || item.name.endsWith('.jpg') || item.name.endsWith('.jpeg') || item.name.endsWith('.gif'))) {
                const listItem = document.createElement('li');
                listItem.textContent = item.name;

                const buttonContainer = document.createElement('div');

                const copyUrlButton = document.createElement('button');
                copyUrlButton.textContent = 'Copy URL';
                copyUrlButton.addEventListener('click', () => {
                    navigator.clipboard.writeText(item.download_url);
                });

                const updateButton = document.createElement('button');
                updateButton.textContent = 'Update';
                updateButton.addEventListener('click', () => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.addEventListener('change', (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onloadend = function() {
                                const base64Content = reader.result.split(',')[1];
                                updateImage(item.path, item.sha, base64Content);
                            }
                            reader.readAsDataURL(file);
                        }
                    });
                    fileInput.click();
                });

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => {
                    deleteImage(item.path, item.sha);
                });

                buttonContainer.appendChild(copyUrlButton);
                buttonContainer.appendChild(updateButton);
                buttonContainer.appendChild(deleteButton);
                listItem.appendChild(buttonContainer);
                imageList.appendChild(listItem);
            }
        });
    }

    function createFolder(folderName) {
        const path = `${currentFolder ? currentFolder + '/' : ''}${folderName}/.gitkeep`;
        const url = `https://api.github.com/repos/${githubRepo}/contents/${path}`;

        const data = {
            message: `Create folder ${folderName}`,
            content: btoa('') // Empty content
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
            } else {
                console.error('Error creating folder:', data);
            }
        })
        .catch(error => {
            console.error('Error creating folder:', error);
        });
    }

    function uploadImage(fileName, base64Content) {
        const path = `${currentFolder ? currentFolder + '/' : ''}${fileName}`;
        const url = `https://api.github.com/repos/${githubRepo}/contents/${path}`;

        // First, try to get the file to see if it exists
        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `token ${githubToken}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                // If the file doesn't exist, response.ok will be false
                return null;
            }
        })
        .then(existingFile => {
            const data = {
                message: `Upload image ${fileName}`,
                content: base64Content,
                sha: existingFile ? existingFile.sha : undefined
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
                    imageUploadInput.value = '';
                } else {
                    console.error('Error uploading image:', data);
                }
            })
            .catch(error => {
                console.error('Error uploading image:', error);
            });
        })
        .catch(error => {
            console.error('Error checking for existing image:', error);
        });
    }

    function deleteImage(path, sha) {
        const url = `https://api.github.com/repos/${githubRepo}/contents/${path}`;

        const data = {
            message: `Delete image ${path}`,
            sha: sha
        };

        fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.commit) {
                getRepoContents(currentFolder);
            } else {
                console.error('Error deleting image:', data);
            }
        })
        .catch(error => {
            console.error('Error deleting image:', error);
        });
    }

    function updateImage(path, sha, base64Content) {
        const url = `https://api.github.com/repos/${githubRepo}/contents/${path}`;

        const data = {
            message: `Update image ${path}`,
            content: base64Content,
            sha: sha
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
            } else {
                console.error('Error updating image:', data);
            }
        })
        .catch(error => {
            console.error('Error updating image:', error);
        });
    }
});
