var loadConfig = () => {
	return new Promise((resolve, reject) => {
		var xhrConfig = new XMLHttpRequest();
		xhrConfig.onreadystatechange = function() {
			if (xhrConfig.status === 200 && xhrConfig.readyState === 4) {
				var config = JSON.parse(xhrConfig.response);
				resolve(config);
			}
		}
		xhrConfig.open("GET", chrome.extension.getURL('/config.json'), true);
		xhrConfig.send();
	})
}

var setHistory = (searchHistory) => {
	chrome.storage.local.set({
		'searchHistory': searchHistory
	})
}

var addToFavorite = (searchQuery) => {
	chrome.storage.local.get('favorites', (result) => {
		var favoritesList;
		if (result.favorites && result.favorites.length) {
			var tempfavoritesList = JSON.parse(JSON.stringify(result.favorites));
			if (tempfavoritesList.indexOf(searchQuery) === -1) {
				tempfavoritesList.push(searchQuery);
			}

			favoritesList = tempfavoritesList;
		} else {
			favoritesList = [searchQuery];
		}

		chrome.storage.local.set({
			'favorites': favoritesList
		})

	})

}

var saveHistory = (searchQuery) => {
	chrome.storage.local.get('searchHistory', (result) => {
		var searchHistory;
		if (result.searchHistory && result.searchHistory.length) {
			var tempHistory = JSON.parse(JSON.stringify(result.searchHistory));
			if (tempHistory.indexOf(searchQuery) === -1) {
				tempHistory.push(searchQuery);
			}

			searchHistory = tempHistory;
		} else {
			searchHistory = [searchQuery];
		}

		setHistory(searchHistory);

	})
}

var noDefinitionsFound = ()=>{
	document.getElementById("resp").innerHTML = '<h3>No definitions found ! </h3> <br> Try modifying your search query. Also use singular instead of plural. <br>Example - Search for <b>account </b> instead of <b>accounts</b> ';
	document.getElementById('add_to_favorite').style.visibility = "hidden";
}

var searchWordMeaning = (searchQuery) => {

	if(searchQuery && searchQuery.length){
		document.getElementById("return_home").click();
		if(!navigator.onLine){
			document.getElementById("resp").innerHTML = "<h2>No Internet Connection !<h2>";
			return false;
		}
		document.getElementById('add_to_favorite').style.visibility = "hidden";
		var wordMeaning = '';
		loadConfig().then(function(config) {
			var xhr = new XMLHttpRequest();
			var apiUrl = "https://od-api.oxforddictionaries.com:443/api/v1/entries/en/" + searchQuery;
			xhr.open("GET", apiUrl, true);
			xhr.setRequestHeader("app_id", config.app_id);
			xhr.setRequestHeader("app_key", config.app_key);
			document.getElementById("resp").innerHTML = '<h3>Loading definitions...</h3>';
			xhr.onreadystatechange = () => {
				if (xhr.readyState === 4) {

					if (xhr.status === 200) {

						var response = JSON.parse(xhr.responseText);

						if (response.results && response.results.length) {
							response.results.forEach((result) => {
								result.lexicalEntries.forEach((lexicalEntry) => {
									lexicalEntry.entries.forEach((subEntry) => {
										wordMeaning = wordMeaning + '<p>';
										subEntry.senses.forEach((sense) => {
											if (sense.definitions && sense.definitions.length) {
												wordMeaning = wordMeaning + sense.definitions[0] + '<br>';
												if (sense.examples && sense.examples.length) {
													wordMeaning = wordMeaning + '<b>';
													wordMeaning = wordMeaning + 'eg:' + sense.examples[0].text + '<br>';
													wordMeaning = wordMeaning + '</b>';

												}

											}

										})
									})
								})
							})

						} else {
							noDefinitionsFound();
						}

						document.getElementById('add_to_favorite').style.visibility = "visible";
						document.getElementById("resp").innerHTML = wordMeaning;
						saveHistory(searchQuery);


					} else {
						noDefinitionsFound();
					}



				}
			}
			xhr.send();
		})


	}
	

}

var showDoneMessage = (message)=>{
	document.getElementById('done-container').style.visibility = "visible";
	document.getElementById("done_message").innerHTML = message;
	setTimeout(()=>{
		document.getElementById('done-container').style.visibility = "hidden";
	},2000);
}

var applyFullScreen = (selectors)=>{
	if(selectors && selectors.length){
		selectors.forEach((selector)=>{
			document.getElementById(selector).style.width="100%";
			document.getElementById(selector).style.height="100%";
		})
	}
	
}

document.addEventListener('DOMContentLoaded', () => {

	document.getElementById('search_query').focus();

	if (window.location.href.split('query=') && window.location.href.split('query=').length && window.location.href.split('query=')[1]) {
		var query = window.location.href.split('query=')[1];
		document.getElementById('search_query').value = query;
		searchWordMeaning(query);
		applyFullScreen(['bodyID','home-section','favorite-section','history-section']);
		document.getElementById('footerID').style.width="100%";
	}

	document.getElementById('add_to_favorite').style.visibility = "hidden";
	document.getElementById('done-container').style.visibility = "hidden";

	

	document.getElementById('add_to_favorite').addEventListener('click', () => {
		addToFavorite(document.getElementById('search_query').value);
		showDoneMessage('Favorited!');
	});

	document.getElementById('clear_history').addEventListener('click', () => {
		setHistory([]);
		document.getElementById("search_history").innerHTML = "History has been cleared";

	});

	document.getElementById('clear_favorites').addEventListener('click', () => {
		chrome.storage.local.set({
			'favorites': []
		})
		document.getElementById("favorites").innerHTML = "Favorites has been cleared";

	});

	document.getElementById('view_history').addEventListener('click', () => {
		chrome.storage.local.get('searchHistory', (result) => {
			if (result.searchHistory && result.searchHistory.length) {
				document.getElementById("search_history").innerHTML = result.searchHistory.join("<br>");

			} else {
				document.getElementById("search_history").innerHTML = "No history found";
			}


		})
	});

	document.getElementById('view_favorites').addEventListener('click', () => {
		chrome.storage.local.get('favorites', (result) => {
			if (result.favorites && result.favorites.length) {
				document.getElementById("favorites").innerHTML = result.favorites.join("<br>");

			} else {
				document.getElementById("favorites").innerHTML = "No favorites found";
			}


		})
	});

	document.getElementById('search_button').addEventListener('click', () => {


		var searchQuery = document.getElementById('search_query').value;
		// saveHistory(searchQuery);
		searchWordMeaning(searchQuery);

	});

	document.ondblclick = function() {
		var sel = (document.selection && document.selection.createRange().text) ||
			(window.getSelection && window.getSelection().toString());
		document.getElementById('search_query').value = sel;
		if(sel && sel.length){
			searchWordMeaning(sel);
		}
		
	};

	document.getElementsByName('searchForm')[0].onsubmit = function(evt) {
		evt.preventDefault();
		var searchQuery = document.getElementById('search_query').value;
		searchWordMeaning(searchQuery);
		document.getElementById('search_query').blur();
	}
});