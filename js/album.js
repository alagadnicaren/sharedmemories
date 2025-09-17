// album.js
document.addEventListener('DOMContentLoaded', function() {
    const albumContent = document.getElementById('album-content');
    const editBtn = document.getElementById('edit-btn');
    let isEditMode = false;
    let pictures = JSON.parse(localStorage.getItem('publicAlbumPictures')) || [];

    // Render the album
    function renderAlbum() {
        albumContent.innerHTML = '';

        if (pictures.length === 0) {
            // Empty state
            albumContent.innerHTML = `
                <div class="empty-state">
                    <p>No memories yet. Add your first picture!</p>
                    <button class="add-memory-btn" id="add-memory-empty">Add Memory</button>
                </div>
            `;
            document.getElementById('add-memory-empty').addEventListener('click', triggerUpload);
        } else {
            // With pictures
            const addBtn = document.createElement('button');
            addBtn.className = 'add-memory-btn add-memory-top';
            addBtn.textContent = 'Add Memory';
            addBtn.addEventListener('click', triggerUpload);
            albumContent.appendChild(addBtn);

            const grid = document.createElement('div');
            grid.className = 'album-grid';
            pictures.forEach((pic, index) => {
                const polaroid = createPolaroid(pic, index);
                grid.appendChild(polaroid);
            });
            albumContent.appendChild(grid);
        }
    }

    // Create polaroid element
    function createPolaroid(pic, index) {
        const div = document.createElement('div');
        div.className = 'polaroid';
        div.draggable = true;
        div.dataset.index = index;

        const currentUser = localStorage.getItem('currentUser');
        const isOwner = pic.uploader === currentUser;
        const hasLiked = pic.likedBy && pic.likedBy.includes(currentUser);

        div.innerHTML = `
            <img src="${pic.src}" alt="Memory ${index + 1}">
            <div class="polaroid-info">
                <div class="polaroid-caption">${pic.caption || 'Memory'}</div>
                <div class="polaroid-meta">
                    <span class="uploader">By: ${pic.uploader}</span>
                    <span class="likes"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="red" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> ${pic.likes || 0}</span>
                </div>
            </div>
            <div class="social-controls">
                <button class="like-btn ${hasLiked ? 'liked' : ''}"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg> Like</button>
                ${isOwner ? `
                <div class="edit-controls">
                    <button class="edit-caption-btn">Edit Caption</button>
                    <button class="delete-btn">Delete</button>
                </div>
                ` : ''}
            </div>
        `;

        // Drag events (only for owner)
        if (isOwner) {
            div.addEventListener('dragstart', handleDragStart);
            div.addEventListener('dragover', handleDragOver);
            div.addEventListener('drop', handleDrop);
        }

        // Like button
        const likeBtn = div.querySelector('.like-btn');
        likeBtn.addEventListener('click', () => toggleLike(index));

        // Edit controls (only for owner)
        if (isOwner) {
            const editCaptionBtn = div.querySelector('.edit-caption-btn');
            const deleteBtn = div.querySelector('.delete-btn');

            editCaptionBtn.addEventListener('click', () => editCaption(index));
            deleteBtn.addEventListener('click', () => deletePicture(index));
        }

        return div;
    }

    // Upload trigger
    function triggerUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.png,.jpeg,.jpg';
        input.addEventListener('change', handleFileUpload);
        input.click();
    }

    // Handle file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const newPic = {
                src: e.target.result,
                caption: 'New Memory',
                uploader: currentUser,
                timestamp: new Date().toISOString(),
                likes: 0,
                likedBy: []
            };
            pictures.push(newPic);
            savePictures();
            renderAlbum();
        };
        reader.readAsDataURL(file);
    }

    // Edit caption
    function editCaption(index) {
        const newCaption = prompt('Enter new caption:', pictures[index].caption);
        if (newCaption !== null) {
            pictures[index].caption = newCaption;
            savePictures();
            renderAlbum();
        }
    }

    // Delete picture
    function deletePicture(index) {
        if (confirm('Are you sure you want to delete this memory?')) {
            pictures.splice(index, 1);
            savePictures();
            renderAlbum();
        }
    }

    // Toggle like
    function toggleLike(index) {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) return;

        const pic = pictures[index];
        if (!pic.likedBy) pic.likedBy = [];

        const userIndex = pic.likedBy.indexOf(currentUser);
        if (userIndex > -1) {
            // Unlike
            pic.likedBy.splice(userIndex, 1);
            pic.likes--;
        } else {
            // Like
            pic.likedBy.push(currentUser);
            pic.likes++;
        }

        savePictures();
        renderAlbum();
    }

    // Drag and drop
    let draggedIndex = null;

    function handleDragStart(e) {
        draggedIndex = parseInt(e.target.dataset.index);
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e) {
        e.preventDefault();
        const targetIndex = parseInt(e.target.closest('.polaroid').dataset.index);
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
            const draggedPic = pictures[draggedIndex];
            pictures.splice(draggedIndex, 1);
            pictures.splice(targetIndex, 0, draggedPic);
            savePictures();
            renderAlbum();
        }
        draggedIndex = null;
    }

    // Edit mode toggle
    editBtn.addEventListener('click', function() {
        isEditMode = !isEditMode;
        document.body.classList.toggle('edit-mode', isEditMode);
        editBtn.textContent = isEditMode ? 'Done' : 'Edit';
    });

    // Save to localStorage
    function savePictures() {
        localStorage.setItem('albumPictures', JSON.stringify(pictures));
    }

    // Initial render
    renderAlbum();
});