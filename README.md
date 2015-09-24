# README #


### What is this repository for? ###

* Chrome plugin to perform chunked download using HTML5 WebWorker threads
* 1.0

### How do I get set up? ###

* Clone the repo
* goto chrome://extensions/ and drag and drop download.crx into the window


### Who do I talk to? ###

* Ashok Rao

### How does it work? ###

* Chunked download on a file can be performed using "Range" request Headers
* Range can be mentioned in request header using the following notation: "Range" : "bytes=0-100" (0-100 specifies the server that only first 100 bytes need to be downloaded)
* If server supports "Range", returns payload with Partial content with http response code 206
* "Range" support is checked using http HEAD call and the total length is noted down
* 5 threads are instantiated using HTML5 WebWorker APIs, each thread downloads 20% of the content simultaneously (6 being the maximun number of concurrent requests chrome can establish with the server)
* There is a limit on number of concurrent requests from a client and thread count can be configured (thread_count in enums)
* On each thread completing the download job, content is returned to parent and thread is terminated
* Finally, all file chunks are merged and a download is triggered