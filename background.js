searchChrominary = function(word){
  var query = word.selectionText;
  chrome.tabs.create({url:"popup.html?query="+query});
};

chrome.contextMenus.create({
  title: "Search in Chrominary",
  contexts:["selection"],
  onclick: searchChrominary
});

