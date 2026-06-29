var DEFAULT_APP_URL = 'http://localhost:5173/startpage/'
var api = typeof browser !== 'undefined' ? browser : chrome

function getStorage(keys, cb) {
  api.storage.sync.get(keys, cb)
}

function setStorage(data, cb) {
  api.storage.sync.set(data, cb || function() {})
}

function getAppUrl(base) {
  var url = (base || DEFAULT_APP_URL).replace(/\/+$/, '')
  return url + '/bookmarks'
}

var currentTab = null

function init() {
  // Settings toggle
  document.getElementById('settings-toggle').addEventListener('click', function() {
    var box = document.getElementById('settings-box')
    var btn = document.getElementById('settings-toggle')
    box.classList.toggle('hidden')
    btn.classList.toggle('open')
  })

  // Save app URL on change
  document.getElementById('app-url').addEventListener('change', function(e) {
    setStorage({ appUrl: e.target.value.trim() })
  })

  // Save button
  document.getElementById('save-btn').addEventListener('click', function() {
    if (currentTab) doSave()
  })

  // Enter key in tags field
  document.getElementById('tags').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && currentTab) doSave()
  })

  // Load saved app URL
  getStorage(['appUrl'], function(result) {
    if (result.appUrl) {
      document.getElementById('app-url').value = result.appUrl
    }
  })

  // Get current tab
  api.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var tab = tabs[0]
    if (!tab || !tab.url) {
      showError('Could not read current page')
      return
    }
    currentTab = tab
    document.getElementById('page-title').textContent = tab.title || tab.url
    document.getElementById('page-url').textContent = tab.url.replace(/^https?:\/\//, '')
    if (tab.favIconUrl) {
      var favicon = document.getElementById('favicon')
      favicon.src = tab.favIconUrl
      favicon.style.display = 'block'
    }
  })
}

function showError(msg) {
  var box = document.getElementById('error-box')
  if (box) {
    box.classList.remove('hidden')
    box.textContent = msg
  }
}

function doSave() {
  var tab = currentTab
  if (!tab) return

  getStorage(['appUrl'], function(result) {
    var base = result.appUrl || DEFAULT_APP_URL
    var tagsInput = document.getElementById('tags').value.trim()

    var params = new URLSearchParams()
    params.set('action', 'add')
    params.set('url', tab.url)
    params.set('title', tab.title || tab.url)
    if (tagsInput) params.set('tags', tagsInput)

    var targetUrl = getAppUrl(base) + '?' + params.toString()
    api.tabs.create({ url: targetUrl })

    var btn = document.getElementById('save-btn')
    btn.disabled = true
    btn.innerHTML = 'Saved!'

    var successBox = document.getElementById('success-box')
    successBox.classList.remove('hidden')

    setTimeout(function() { window.close() }, 1500)
  })
}

init()
