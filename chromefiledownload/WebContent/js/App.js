jQuery(function($) {
	'use strict';

	/*Enums for the App*/
	var enums = {
			http_get: "GET",
			http_head: "HEAD",
			thread_count: 5
	};

	/**
	 * Utility class for the App
	 */
	var util = {
			/*Util Module*/
			connector: function(oData, callback){
				var sUrl = oData.url || "",
				oHeaders = oData.headers || {},
				sMethod = oData.method;

				$.ajax({
					url: sUrl,
					type: sMethod,
					headers: oHeaders,
					success: function(){
						callback.apply( null, arguments );
					},
					error: function(){
						//error handler
					}
				});

			}
	};

	var App = {
			init: function() {
				/**
				 * get view elements and store
				 */
				this.url = "";

				this.cacheElements();
				this.bindEvents();
			},
			cacheElements: function() {
				this.$App = $('#app');

				//URL and buttons
				this.$input = this.$App.find('#search');
				this.$download = this.$App.find("#download");

				this.$document = $(window.document);
			},
			bindEvents: function() {
				/**
				 * Event registration for search
				 * optimization: call search once user finishes typing
				 * have given 500ms delay to register a callback
				 * registers only once by debounce method on typing letters
				 */
				this.$download.on("click", this.download.bind(this));


			},
			download: function(e){
				//get URL and validate
				this.url = this.$input.val().trim();

				/**
				 * A call with HTTP method HEAD
				 * returns all the response headers but not the payload
				 * Range is set in request headers to check if the Server supports the chunked downlaod
				 */
				util.connector({
					"method": enums.http_head,
					"url": this.url,
					"headers": {
						"Range" : "bytes=0-"
					}
				}, $.proxy(this._onGettingFilesize, this));
			},
			_onGettingFilesize: function(data, success, xhr){
				/**
				 * Call back for the HTTP method HEAD
				 * if response code is 206 then the server supports chunked download
				 * process with multiple thread
				 */
				if(xhr.statusCode().status === 206 && xhr.getResponseHeader("Content-Length")){
					//supports partial content
					var sLength = xhr.getResponseHeader("Content-Length"),//bytes
					iLength = parseInt(sLength),
					iRange = Math.floor(iLength/enums.thread_count),
					that = this,
					mime = xhr.getResponseHeader("Content-type"),
					fileName = this.url.substring(this.url.lastIndexOf('/')+1),
					aWorkers = [], //array to store worker instances
					aBlobs = []; //array to store blob instances from each worker thread

					/*var aRange = [];
					aRange.push(0); //0
					aRange.push(iRange);// 0 - iRange

					aRange.push(iRange*2);//(iRange[0] + 1) to iRange*2
					aRange.push(iRange*3);//(iRange[0] + 1) to iRange*2
					aRange.push(iRange*4);//(iRange[0] + 1) to iRange*2
					aRange.push(iLength);//iRange*2 + 1 to ContentLength
					 */					



					for(var i = 0; i < enums.thread_count; i++){
						//closure to remember the context 
						(function(i){

							/**
							 * determine starting byte and end byte for chunk download
							 */
							var start, end;
							start = (i > 0) ? (iRange * i + 1) : 0; 
							end = (i === enums.thread_count - 1) ? (iRange * (i + 1)) :  iLength; 

							//create i th worker with worker.js file
							aWorkers[i] = new Worker("js/worker.js");
							/**
							 * data required for each thread:
							 * HTTP method
							 * start byte for chunked downlaod
							 * end byte for chunk download
							 * mime type - received from HEAD
							 */
							var data = {
									method: enums.http_get,
									url : that.url,
									start: start,
									end: end,
									mime: mime
							};
							/**
							 * callback for worker thread on completing the job
							 */
							aWorkers[i].onmessage = function(e) {

								/**
								 * store blob data in array for each thread
								 */
								aBlobs[i] = e.data;

								/**
								 * check if all the threads have returned data
								 */
								var bCheck = true;
								for(var j = 0; j < enums.thread_count; j++){
									if(!aBlobs[j]){
										//not all threads have returned data
										bCheck = false;
										break;
									}
								}

								if(bCheck){
									/**
									 * create a file by merging chunks
									 */
									var finalBlob = new Blob(aBlobs, {type: mime}),
									a = document.createElement("a"),
									sObjUrl = URL.createObjectURL(finalBlob);

									//append the hyperlink to document
									document.body.appendChild(a);
									a.href = sObjUrl;
									a.download = fileName;
									//trigger download on the blob
									a.click();
									window.URL.revokeObjectURL(sObjUrl);
								}
								/**
								 * terminate the worker thread on completing the job
								 */
								aWorkers[i].terminate();

							}
							/**
							 * start the worker thread
							 */
							aWorkers[i].postMessage(data);
						})(i);
					}
				}else{
					/**
					 * Server doesnt support chunked download
					 * fallback: do normal download
					 **/
					var link = document.createElement("a");

					//append the hyperlink to document
					document.body.appendChild(link);
					link.href = this.url;
					link.download = this.url.substring(this.url.lastIndexOf('/')+1);
					//trigger download on the blob
					link.click();
					
				}
			}

	};
	//call the init method
	App.init();


});