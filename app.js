/*
 * app.js
 *
 * This script powers a simple novel reading website with user
 * authentication, membership tiers (free vs premium) and reading
 * progress tracking. It uses the browser's localStorage to persist
 * user accounts, login state and progress. The site does not
 * connect to any backend; everything runs in the client for
 * demonstration purposes.
 */

// Utility: load novels from the JSON file. Returns a promise that
// resolves to the JSON data structure.
function loadNovelsData() {
  return fetch('data/novels.json')
    .then((res) => res.json())
    .catch((err) => {
      console.error('Failed to load novels:', err);
      return { novels: [] };
    });
}

// Retrieve the array of user objects from localStorage. If none
// exists yet, return an empty array. Users have the structure
// { username: string, password: string, membership: 'free'|'premium' }.
function getUsers() {
  const usersStr = localStorage.getItem('users');
  if (!usersStr) return [];
  try {
    return JSON.parse(usersStr);
  } catch (e) {
    console.error('Error parsing users from localStorage', e);
    return [];
  }
}

// Save the users array back to localStorage.
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

// Get the current logged in user's username, or null if not logged in.
function getCurrentUsername() {
  return localStorage.getItem('currentUser') || null;
}

// Retrieve the user object corresponding to the current logged in user.
function getCurrentUser() {
  const username = getCurrentUsername();
  if (!username) return null;
  const users = getUsers();
  return users.find((u) => u.username === username) || null;
}

// Register a new user. Called from the index page's register form.
function register() {
  const usernameInput = document.getElementById('reg-username');
  const passwordInput = document.getElementById('reg-password');
  const message = document.getElementById('reg-message');
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  message.textContent = '';
  if (!username || !password) {
    message.textContent = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.';
    return;
  }
  const users = getUsers();
  if (users.some((u) => u.username === username)) {
    message.textContent = 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.';
    return;
  }
  users.push({ username, password, membership: 'free' });
  saveUsers(users);
  // Optionally log the user in automatically after registration
  localStorage.setItem('currentUser', username);
  usernameInput.value = '';
  passwordInput.value = '';
  message.textContent = 'Đăng ký thành công! Bạn đã được đăng nhập.';
  updateAuthUI();
}

// Log a user in based on form fields. Called from the index page.
function login() {
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const message = document.getElementById('login-message');
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  message.textContent = '';
  if (!username || !password) {
    message.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.';
    return;
  }
  const users = getUsers();
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    message.textContent = 'Tên đăng nhập hoặc mật khẩu không đúng.';
    return;
  }
  localStorage.setItem('currentUser', username);
  usernameInput.value = '';
  passwordInput.value = '';
  message.textContent = '';
  updateAuthUI();
}

// Log the user out. Removes the currentUser key.
function logout() {
  localStorage.removeItem('currentUser');
  updateAuthUI();
}

// Upgrade the current user to premium membership. This is a simulation
// of a payment process; in a real application you would integrate
// Stripe or PayPal. Here we simply change the membership field in
// localStorage.
function subscribePremium() {
  const user = getCurrentUser();
  if (!user) return;
  if (user.membership === 'premium') return;
  user.membership = 'premium';
  // Update the users list
  const users = getUsers().map((u) => (u.username === user.username ? user : u));
  saveUsers(users);
  updateAuthUI();
  alert('Bạn đã nâng cấp lên gói Premium thành công!');
}

// Update UI related to authentication and membership. Shows/hides
// login/register forms and displays user info in the navbar.
function updateAuthUI() {
  const userInfoDiv = document.getElementById('user-info');
  const authForms = document.getElementById('auth-forms');
  const currentUser = getCurrentUser();
  if (!userInfoDiv) return;
  if (currentUser) {
    // Hide auth forms if present
    if (authForms) authForms.style.display = 'none';
    // Display greeting, membership, logout and subscribe buttons
    let html = `<span>Xin chào, ${currentUser.username} (${currentUser.membership === 'premium' ? 'Premium' : 'Free'})</span>`;
    if (currentUser.membership === 'free') {
      html += ` <button onclick="subscribePremium()" class="button" style="margin-left:10px;">Nâng cấp Premium</button>`;
    }
    html += ` <button onclick="logout()" class="button" style="margin-left:10px;">Đăng xuất</button>`;
    userInfoDiv.innerHTML = html;
  } else {
    // Show auth forms on index page and clear user info
    if (authForms) authForms.style.display = '';
    userInfoDiv.innerHTML = '';
  }
}

// Load and display the list of novels on the index page
// Global cache of novels for search
let allNovelsCache = null;

// Render a list of novels into the novel-list container
function displayNovels(novels) {
  const listDiv = document.getElementById('novel-list');
  if (!listDiv) return;
  listDiv.innerHTML = '';
  novels.forEach((novel) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${novel.title}</h3>
      <p><strong>Tác giả:</strong> ${novel.author}</p>
      <p>${novel.description}</p>
      <a href="novel.html?id=${novel.id}" class="button">Xem chi tiết</a>
    `;
    listDiv.appendChild(card);
  });
  if (novels.length === 0) {
    listDiv.innerHTML = '<p>Không tìm thấy tiểu thuyết phù hợp.</p>';
  }
}

// Load novels from JSON and cache them, then display them (with optional search)
function loadNovels() {
  loadNovelsData().then((data) => {
    allNovelsCache = data.novels;
    displayNovels(allNovelsCache);
  });
}

// Search novels based on the search input value. Filters by title, author or description.
function searchNovels() {
  const queryInput = document.getElementById('search-input');
  if (!queryInput) return;
  const q = queryInput.value.toLowerCase().trim();
  if (!allNovelsCache) {
    // Data not loaded yet; load and then search
    loadNovelsData().then((data) => {
      allNovelsCache = data.novels;
      performSearch(q);
    });
  } else {
    performSearch(q);
  }
}

// Helper to perform the actual search on the cached novels and display results
function performSearch(query) {
  if (!query) {
    displayNovels(allNovelsCache);
    return;
  }
  const filtered = allNovelsCache.filter((novel) => {
    return (
      novel.title.toLowerCase().includes(query) ||
      novel.author.toLowerCase().includes(query) ||
      novel.description.toLowerCase().includes(query)
    );
  });
  displayNovels(filtered);
}

// Load and display details for a single novel
function loadNovelDetail(novelId) {
  loadNovelsData().then((data) => {
    const novel = data.novels.find((n) => n.id === novelId);
    const detailDiv = document.getElementById('novel-detail');
    const chapterList = document.getElementById('chapter-list');
    if (!novel || !detailDiv || !chapterList) return;
    // Show novel details
    detailDiv.innerHTML = `
      <h2>${novel.title}</h2>
      <p><strong>Tác giả:</strong> ${novel.author}</p>
      <p>${novel.description}</p>
    `;
    // Populate chapter list
    chapterList.innerHTML = '';
    const user = getCurrentUser();
    const progress = user ? getProgressForNovel(user.username, novelId) : {};
    novel.chapters.forEach((ch) => {
      const li = document.createElement('li');
      li.className = 'chapter-item';
      let status = '';
      if (progress.readChapters && progress.readChapters.includes(ch.id)) {
        status = '<span class="badge badge-success">Đã đọc</span>';
      }
      if (ch.premium) {
        // mark as premium
        status += ' <span class="badge badge-premium">Premium</span>';
      }
      li.innerHTML = `<a href="chapter.html?novelId=${novel.id}&chapterId=${ch.id}">${ch.title}</a> ${status}`;
      chapterList.appendChild(li);
    });
  });
}

// Load a specific chapter for reading
function loadChapter(novelId, chapterId) {
  loadNovelsData().then((data) => {
    const novel = data.novels.find((n) => n.id === novelId);
    if (!novel) return;
    const chapter = novel.chapters.find((ch) => ch.id === chapterId);
    const titleElem = document.getElementById('chapter-title');
    const contentElem = document.getElementById('chapter-content');
    const premiumMsg = document.getElementById('premium-message');
    const markReadBtn = document.getElementById('mark-read-btn');
    const prevLink = document.getElementById('prev-chapter');
    const nextLink = document.getElementById('next-chapter');
    const novelLinkSpan = document.getElementById('novel-link');
    // Clear any messages
    if (!chapter || !titleElem || !contentElem) return;
    titleElem.textContent = chapter.title;
    premiumMsg.textContent = '';
    // Provide link back to novel page
    if (novelLinkSpan) {
      novelLinkSpan.innerHTML = ` &raquo; <a href="novel.html?id=${novel.id}">${novel.title}</a>`;
    }
    const user = getCurrentUser();
    const isPremiumChapter = chapter.premium;
    let allowed = true;
    if (isPremiumChapter) {
      // Only allow if user is premium
      if (!user || user.membership !== 'premium') {
        allowed = false;
      }
    }
    if (!allowed) {
      // Show premium message and hide content/mark read button
      contentElem.innerHTML = '';
      premiumMsg.textContent = 'Đây là chương Premium. Vui lòng nâng cấp để tiếp tục đọc.';
      if (markReadBtn) markReadBtn.style.display = 'none';
    } else {
      // Show chapter content
      contentElem.innerHTML = chapter.content;
      if (markReadBtn) markReadBtn.style.display = '';
      // Attach event for marking as read
      if (markReadBtn) {
        markReadBtn.onclick = function() {
          markChapterAsRead(novelId, chapterId);
        };
      }
    }
    // Update previous/next links
    const index = novel.chapters.findIndex((ch) => ch.id === chapterId);
    if (prevLink) {
      if (index > 0) {
        const prevId = novel.chapters[index - 1].id;
        prevLink.href = `chapter.html?novelId=${novel.id}&chapterId=${prevId}`;
        prevLink.style.display = '';
      } else {
        prevLink.style.display = 'none';
      }
    }
    if (nextLink) {
      if (index < novel.chapters.length - 1) {
        const nextId = novel.chapters[index + 1].id;
        nextLink.href = `chapter.html?novelId=${novel.id}&chapterId=${nextId}`;
        nextLink.style.display = '';
      } else {
        nextLink.style.display = 'none';
      }
    }

    // Load comments for this chapter
    loadComments(novelId, chapterId);
  });
}

// Retrieve reading progress object for a user and novel. The data is
// stored in localStorage under key `reading_progress_${username}` as
// an object mapping novelId to { readChapters: [...], lastRead: int }.
function getProgressForNovel(username, novelId) {
  const key = `reading_progress_${username}`;
  const dataStr = localStorage.getItem(key);
  if (!dataStr) return {};
  try {
    const progress = JSON.parse(dataStr);
    return progress[novelId] || {};
  } catch (e) {
    console.error('Error parsing reading progress', e);
    return {};
  }
}

// Save progress for a user and novel back to localStorage
function saveProgressForNovel(username, novelId, progressObj) {
  const key = `reading_progress_${username}`;
  let data = {};
  const existing = localStorage.getItem(key);
  if (existing) {
    try {
      data = JSON.parse(existing);
    } catch (e) {
      console.error('Error parsing existing progress', e);
    }
  }
  data[novelId] = progressObj;
  localStorage.setItem(key, JSON.stringify(data));
}

// Mark a chapter as read for the current user. Updates the progress
// and refreshes the chapter list badges if on the novel page.
function markChapterAsRead(novelId, chapterId) {
  const user = getCurrentUser();
  if (!user) {
    alert('Vui lòng đăng nhập để đánh dấu chương đã đọc.');
    return;
  }
  const progress = getProgressForNovel(user.username, novelId);
  const readChapters = progress.readChapters || [];
  if (!readChapters.includes(chapterId)) {
    readChapters.push(chapterId);
  }
  const lastRead = chapterId;
  saveProgressForNovel(user.username, novelId, { readChapters, lastRead });
  alert('Đã đánh dấu chương này là đã đọc!');
}

// Optional: export functions to global scope for HTML onclick handlers
window.register = register;
window.login = login;
window.logout = logout;
window.subscribePremium = subscribePremium;
window.updateAuthUI = updateAuthUI;
window.loadNovels = loadNovels;
window.loadNovelDetail = loadNovelDetail;
window.loadChapter = loadChapter;
window.markChapterAsRead = markChapterAsRead;
window.searchNovels = searchNovels;
// Comments
window.addComment = addComment;

/*
 * Comments functionality
 * Each chapter has a separate comments list stored in localStorage under key
 * `comments_<novelId>_<chapterId>`. Comments are an array of objects
 * { username, timestamp, content }. Only logged-in users can post.
 */
function loadComments(novelId, chapterId) {
  const listElem = document.getElementById('comments-list');
  const formElem = document.getElementById('comment-form');
  if (!listElem || !formElem) return;
  const key = `comments_${novelId}_${chapterId}`;
  let comments = [];
  try {
    const stored = localStorage.getItem(key);
    comments = stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error loading comments', e);
  }
  // Render comments
  listElem.innerHTML = '';
  if (comments.length === 0) {
    listElem.innerHTML = '<p>Chưa có bình luận nào.</p>';
  } else {
    comments.forEach((c) => {
      const div = document.createElement('div');
      div.style.borderBottom = '1px solid #eee';
      div.style.padding = '8px 0';
      const date = new Date(c.timestamp);
      div.innerHTML = `<strong>${c.username}</strong> <span style="color:#777;font-size:0.8em;">(${date.toLocaleString()})</span><p>${c.content}</p>`;
      listElem.appendChild(div);
    });
  }
  // Render comment form depending on user login
  formElem.innerHTML = '';
  const user = getCurrentUser();
  if (!user) {
    formElem.innerHTML = '<p>Vui lòng đăng nhập để bình luận.</p>';
  } else {
    const textarea = document.createElement('textarea');
    textarea.id = 'comment-text';
    textarea.rows = 3;
    textarea.style.width = '100%';
    textarea.placeholder = 'Nội dung bình luận...';
    const btn = document.createElement('button');
    btn.className = 'button';
    btn.textContent = 'Gửi bình luận';
    btn.onclick = function() {
      addComment(novelId, chapterId);
    };
    formElem.appendChild(textarea);
    formElem.appendChild(btn);
  }
}

function addComment(novelId, chapterId) {
  const user = getCurrentUser();
  if (!user) {
    alert('Vui lòng đăng nhập để bình luận.');
    return;
  }
  const textarea = document.getElementById('comment-text');
  if (!textarea) return;
  const content = textarea.value.trim();
  if (!content) {
    alert('Vui lòng nhập nội dung bình luận.');
    return;
  }
  const key = `comments_${novelId}_${chapterId}`;
  let comments = [];
  try {
    const stored = localStorage.getItem(key);
    comments = stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error parsing comments', e);
  }
  comments.push({ username: user.username, timestamp: Date.now(), content });
  localStorage.setItem(key, JSON.stringify(comments));
  textarea.value = '';
  loadComments(novelId, chapterId);
}