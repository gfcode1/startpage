var DEFAULT_APP_URL = 'http://localhost:5173/startpage/'
var api = typeof browser !== 'undefined' ? browser : chrome

api.runtime.onInstalled.addListener(function() {
  api.contextMenus.create({
    id: 'save-to-startdeck',
    title: 'Save to StartDeck',
    contexts: ['page', 'link', 'image']
  })
})

api.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId !== 'save-to-startdeck') return

  api.storage.sync.get(['appUrl'], function(result) {
    var base = (result.appUrl || DEFAULT_APP_URL).replace(/\/+$/, '')
    var url = info.linkUrl || info.srcUrl || info.pageUrl || tab.url
    if (!url) return

    var params = new URLSearchParams()
    params.set('action', 'add')
    params.set('url', url)
    if (!info.linkUrl && !info.srcUrl && tab.title) {
      params.set('title', tab.title)
    }

    var targetUrl = base + '/bookmarks?' + params.toString()
    api.tabs.create({ url: targetUrl })
  })
})
