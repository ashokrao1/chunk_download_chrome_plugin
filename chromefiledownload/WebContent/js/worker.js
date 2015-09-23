onmessage = function (e) {
	
	/**
	 * Script for workewr thead
	 * on postmessage from parent onmessage is called
	 * Download from BE using chunk details
	 * Get the blob 
	 * return the blob to main thread
	 */
     var data = e.data;
	 var that = self; 
     var xhr = new XMLHttpRequest();

     xhr.open(data.method, data.url, true);
     xhr.setRequestHeader("Range", "bytes=" + data.start + "-" + data.end);
     xhr.responseType = 'blob';

     xhr.onload = function (e) {
         if (this.status === 206) {
            
             //create blob from reciived data
             var blob = new Blob([this.response], {
                 type: data.mime
             });
             that.postMessage(blob);
         }
     }
     xhr.send();
 }