/* global Module */

/* Magic Mirror
 * Module: plexdeck
 *
 * By Robert Shippey
 * MIT Licensed.
 */

Module.register("MMM-plexdeck", {
	defaults: {
		updateInterval: 300000,
		retryDelay: 5000
	},

 requiresVersion: "2.1.0", // Required version of MagicMirror

 start: function() {
	 var self = this;
	 var dataRequest = null;
	 var dataNotification = null;

	 //Flag for check if module is loaded
	 this.loaded = false;

	 // Schedule update timer.
	 this.getData();
	 setInterval(function() {
		 self.updateDom();
	 }, this.config.updateInterval);
 },

 /*
	* getData
	* function example return data and show it in the module wrapper
	* get a URL request
	*
	*/
	getData: function() {
		var self = this;

		var plexToken = (this.config.securityToken != undefined) ? "?X-Plex-Token=" + this.config.securityToken : "";

		var urlApi = this.config.plexURL + "/library/onDeck";
		urlApi += plexToken;
		var retry = true;

		var dataRequest = new XMLHttpRequest();

		dataRequest.open("GET", urlApi, true);
		dataRequest.setRequestHeader("Accept", "application/json");
		dataRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processData(JSON.parse(this.response));
				} else if (this.status === 401) {
					self.updateDom(self.config.animationSpeed);
					Log.error(self.name, this.status);
					retry = false;
				} else {
					Log.error(self.name, "Could not load data.");
				}
				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		dataRequest.send();
	},


 /* scheduleUpdate()
	* Schedule next update.
	*
	* argument delay number - Milliseconds before next update.
	*  If empty, this.config.updateInterval is used.
	*/
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad ;
		var self = this;
		setTimeout(function() {
			self.getData();
		}, nextLoad);
	},

	getDom: function() {
		var self = this;

		var plexToken = (this.config.securityToken != undefined) ? "?X-Plex-Token=" + this.config.securityToken : "";

		// create element wrapper for show into the module
		var table = document.createElement("table");
		// If this.dataRequest is not empty
		if (this.dataRequest) {

			var metadata = this.dataRequest.MediaContainer.Metadata;

			metadata = (this.config.sortByLatest != undefined) ? metadata.sort(self.sortByLatest) : metadata;

			metadata = (this.config.countToDisplay != undefined) ? metadata.slice(0, this.config.countToDisplay) : metadata;

			metadata.forEach(function(element) {

			 var show = document.createElement("tr");

			 var cover = new Image();
			 var coverArt = (element.grandparentArt != null) ? self.config.plexURL + element.grandparentArt + plexToken : self.config.plexURL + element.art + plexToken;
			 cover.src = coverArt
			 cover.className = "thumbnail";

			 var title = document.createElement("span");
			 title.className = "bright small show";
			 title.innerHTML = (element.grandparentTitle != undefined) ? element.grandparentTitle + " – " + element.title : element.title;

			 var coverTD = document.createElement("td");
			 var titleTD = document.createElement("td");

			 coverTD.appendChild(cover);
			 titleTD.appendChild(title);

			 show.appendChild(coverTD);
			 show.appendChild(titleTD);

			 table.appendChild(show);
		 });
	 }
	 return table;
 },

 getScripts: function() {
	 return [];
 },

 getStyles: function () {
	 return ["PlexDeck.css"];
 },

 // Load translations files
 getTranslations: function() {
	 //FIXME: This can be load a one file javascript definition
	 return {
		 en: "translations/en.json",
		 es: "translations/es.json"
	 };
 },

 processData: function(data) {
	 var self = this;
	 this.dataRequest = data;
	 if (this.loaded === false) { self.updateDom(self.config.animationSpeed); }
	 this.loaded = true;

	 // the data if load
	 // send notification to helper
	 // this.sendSocketNotification("plexdeck-NOTIFICATION_TEST", data);
 },

 // socketNotificationReceived from helper
 socketNotificationReceived: function (notification, payload) {
	 if(notification === "plexdeck-NOTIFICATION_TEST") {
		 // set dataNotification
		 this.dataNotification = payload;
		 this.updateDom();
	 }
 },

 sortByLatest: function(a,b){
		if (a.originallyAvailableAt > b.originallyAvailableAt)
			return -1;
		if (a.originallyAvailableAt < b.originallyAvailableAt)
			return 1;
		return 0;
 },
});
