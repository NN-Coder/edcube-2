'use strict';
function IntentIqObject(configurationObject) {
    this.version = 4;
    this.intentIqData = {};
    this.wasServerCalled = false;
    this.wasCallFromConstructor = false;
    this.wasCallbackFired = false;
    this.wasDebugCheck = false;
    this.isDebugMode = false;
    //total calls counter
    this.callCount = 0;
    //no data - any response where there were no data
    this.noDataCounter = 0;
    //total fail counter
    this.failCount = 0;
    this.metadataConstant = 256;
    this.syncRefreshMillis = 3600000; // 1 hour
    this.shouldCallServer = false;

    this.prebidDetectionRetries = 100;
    this.prebidDellayBeforeRetry = 20;

    this.pbjs = undefined;

    /**
     * Translated data to a proper format
     * @param {*} data 
     * @returns 
     */
    this.translateMetadata = function (data) {
        try {
            var d = data.split('.');
            return ((((((+d[0]) * this.metadataConstant) + (+d[1])) * this.metadataConstant) + (+d[2])) * this.metadataConstant) + (+d[3]);
        }
        catch (e) {
            return NaN;
        }
    };

    this.vrOperationalMode = 'VR';
    this.pixelOperationalMode = 'PIXEL';
    this.dualOperationalMode = 'DUAL';

    this.getOperationalMode = function (value) {
        try {
            switch (value.toLowerCase()) {
                case 'bidenhancement': return this.vrOperationalMode;//BidEnhancement
                case 'sync': return this.pixelOperationalMode;//Sync
                case 'both': return this.dualOperationalMode;//Both
            }
        }
        catch (e) {
            this.logger(e);
        }
        return 'DUAL'
    }

    this.verifyIdType = function (value) {
        if (value === 0 || value === 1 || value === 3 || value === 4)
            return value;
        else
            return -1;
    }

    this.intentIqConfig = {
        partner: configurationObject ? configurationObject.partner : null,
        // Default 12 hours
        refreshInMillis: configurationObject && typeof configurationObject.refreshInMillis === 'number' ? configurationObject.refreshInMillis : 43200000,
        // Default 3 seconds
        timeoutInMillis: configurationObject && typeof configurationObject.timeoutInMillis === 'number' ? configurationObject.timeoutInMillis : 3000,
        // Determine if the http request should be async to avoid blocking page loading
        isAsyncServerRequest: configurationObject && typeof configurationObject.isAsyncServerRequest === 'boolean' ? configurationObject.isAsyncServerRequest : true,
        //callback function
        callback: configurationObject && typeof configurationObject.callback === 'function' ? configurationObject.callback : null,
        //enables reques enchancement for all prebid request - require custom prebid
        enhanceRequests: configurationObject && typeof configurationObject.enhanceRequests === 'boolean' ? configurationObject.enhanceRequests : true,
        //additional source data 
        sourceMetaData: configurationObject && typeof configurationObject.sourceMetaData === 'string' ? this.translateMetadata(configurationObject.sourceMetaData) : this.translateMetadata(""),
        //IIQ server for requests
        iiqServerAddress: configurationObject && typeof configurationObject.iiqServerAddress === 'string' ? configurationObject.iiqServerAddress : `https://api.intentiq.com`,
        //IIQ server for requests
        iiqPixelServerAddress: configurationObject && typeof configurationObject.iiqPixelServerAddress === 'string' ? configurationObject.iiqPixelServerAddress : `https://sync.intentiq.com`,
        //identify as cellular in debug mode
        isCellular: configurationObject && typeof configurationObject.isCellular === 'boolean' ? configurationObject.isCellular : false,
        //operationl mode: BidEnhancement, Sync , Both
        mode: configurationObject && typeof configurationObject.mode === 'string' ? this.getOperationalMode(configurationObject.mode) : 'DUAL',
        //partner's first party client id (value) 
        partnerClientId: configurationObject && typeof configurationObject.partnerClientId === 'string' ? configurationObject.partnerClientId : '',
        //partner's first party client id type: 3rd party cookie = 0, IDFV = 1, first party id = 3, MAID/AAID = 4
        partnerClientIdType: configurationObject && typeof configurationObject.partnerClientIdType === 'number' ? this.verifyIdType(configurationObject.partnerClientIdType) : -1,
    }
    this.currentDataTTl = this.intentIqConfig.refreshInMillis;
    this.intentIqSyncPartnerId = 1048688155;
    this.FIRST_PARTY_KEY = '_iiq_fdata';
    this.PARTNER_DATA_KEY = this.FIRST_PARTY_KEY + "_" + this.intentIqConfig.partner;
    this.LAST_SYNC_KEY = '_iiq_sync';

    let intentIqObject = this;

    /*  #region utils and functions */
    /**
     * Log message to console on debug mode
     * @param msg
     */
    this.logger = function (msg) {
        if (this.isDebug())
            console.log(msg);
    }.bind(this);

    /**
     * Updates meta data on demmand
     * @param {*} newData 
     */
    this.updateMetaData = function (newData) {
        this.intentIqConfig.sourceMetaData = this.translateMetadata(newData);
    }

    /**
     * Generate standard UUID string
     * @return {string}
     */
    this.generateGUID = function () {
        let d = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    };

    /**
     * Check url for debug=true param, to test if running in debug mode
     * @returns {boolean}
     */
    this.isDebug = function () {
        if (!this.wasDebugCheck) {
            const field = 'debug';
            const url = window.location.href;
            if (url.indexOf('?' + field + '=true') !== -1 || url.indexOf('&' + field + '=') !== -1) {
                this.isDebugMode = true;
            }
            this.wasDebugCheck = true;
        }
        return this.isDebugMode;
    };

    /**
     * Check if has local storage support
     * @returns {boolean}
     */
    this.hasLocalStorage = function () {
        try {
            return !!window.localStorage;
        } catch (e) {
            this.failCount++;
            this.logger('Local storage api disabled');
        }
        return false;
    };

    this.clearCounters = function () {
        this.callCount = 0;
        this.failCount = 0;
        this.noDataCounter = 0;
    }

    /**
     * Read Intent IQ data from cookie or local storage
     * @param key
     * @return {string}
     */
    this.readData = function (key) {
        try {
            if (this.hasLocalStorage()) {
                return window.localStorage.getItem(key);
            }
        } catch (error) {
            this.failCount++;
            this.logger(error);
        }
        return null;
    };


    /**
     * Store Intent IQ data in either cookie or local storage
     * expiration date: 365 days
     * @param key
     * @param {string} value IntentIQ ID value to sintentIqIdSystem_spec.jstore
     */
    this.storeData = function (key, value) {
        try {
            this.logger('IntentIQ: storing data: key=' + key + ' value=' + value);
            if (value) {
                if (this.hasLocalStorage()) {
                    window.localStorage.setItem(key, value);
                }
            }
        } catch (error) {
            this.failCount++;
            this.logger(error);
        }
    };

    /**
     * Generate random ip in the US
     * @returns {string}
     */
    this.generateRandomUsIp = function () {
        let ip = window.localStorage.getItem('_iiq_ip');
        if (!ip ||
            (this.isIpCellular(ip) && !this.intentIqConfig.isCellular) ||
            (!this.isIpCellular(ip) && this.intentIqConfig.isCellular)
        ) {
            ip = this.generateNewRandomIp(this.intentIqConfig.isCellular)
            window.localStorage.setItem('_iiq_ip', ip);
        }
        return ip;
    };

    this.isIpCellular = function (ip) {
        return ip.startsWith('107.77.208.')
    }
    this.generateNewRandomIp = function (isCellular) {
        let ip = '98.115.221.';
        if (isCellular)
            ip = '107.77.208.';
        ip += Math.floor(Math.random() * 255);
        return ip;
    }

    /**
     * Parse json if possible, else return null
     * @param data
     */
    this.tryParse = function (data) {
        try {
            return JSON.parse(data);
        } catch (err) {
            this.failCount++;
            this.logger(err);
        }
        return null;
    };

    /**
     * Parse json if possible, else return null
     * @param data
     */
    this.tryParseInt = function (data) {
        try {
            return parseInt(data, 10);
        } catch (err) {
            this.failCount++;
            this.logger(err);
            return -1;
        }
    };

    /**
     * Http get using XMLHttpRequest to support old browser versions
     * @param url
     * @param timeoutInMillis
     * @param callback
     */
    this.getRequest = function (url, timeoutInMillis, callback) {
        let xhr = new XMLHttpRequest();
        if (this.intentIqConfig.isAsyncServerRequest) {
            xhr.open("GET", url, true);
        } else {
            xhr.open("GET", url, false);
        }
        xhr.withCredentials = true;
        xhr.timeout = timeoutInMillis;
        xhr.onreadystatechange = function () {
            if (callback && xhr.readyState === 4) {
                callback(xhr.responseText);
            }
        }
        xhr.send();
    };

    /**
     * Build the url for the server request
     * @param firstPartyData
     * @returns {string}
     */
    this.createRequestUrl = function () {
        // use protocol relative urls for http or https
        let url = this.intentIqConfig.iiqServerAddress + `/profiles_engine/ProfilesEngineServlet?at=39&mi=10&dpi=${this.intentIqConfig.partner}&pt=17&dpn=1`;
        url += this.intentIqConfig.pai ? '&pai=' + encodeURIComponent(this.intentIqConfig.pai) : '';
        url += this.version ? '&jsver=' + encodeURIComponent(this.version) : '';
        url = this.appendFirstPartyDataToUrl(url);
        url += typeof this.callCount === 'number' ? '&iiqcallcount=' + encodeURIComponent(this.callCount) : '';
        url += typeof this.failCount === 'number' ? '&iiqfailcount=' + encodeURIComponent(this.failCount) : '';
        url += typeof this.noDataCounter === 'number' ? '&iiqnodata=' + encodeURIComponent(this.noDataCounter > 0) : '';
        url += '&iiqlocalstorageenabled=' + encodeURIComponent(this.failCount);
        url = this.addUniquenessToUrl(url);
        url = this.addMetaData(url);
        url += '&cttl=' + encodeURIComponent(this.currentDataTTl);
        url = this.appendPartnersFirsyParty(url);
        return url;
    };

    /**
     * adds metadata to to a request
     * @param {*} url 
     * @returns 
     */
    this.addMetaData = function (url) {
        if (isNaN(this.intentIqConfig.sourceMetaData))
            return url;
        url += '&fbp=' + this.intentIqConfig.sourceMetaData;
        return url;
    }

    /**
     * Adds some uniqueness to a request to avoid stickiness
     * @param {} url 
     * @returns 
     */
    this.addUniquenessToUrl = function (url) {
        url += '&tsrnd=' + Math.floor(Math.random() * 1000) + '_' + (new Date()).getTime();
        return url;
    }

    /**
     * Append the first party data to the url string
     * @param firstPartyData
     * @param url
     * @returns {*}
     */
    this.appendFirstPartyDataToUrl = function (url) {
        url += this.isDebug() ? '&ip=' + encodeURIComponent(this.generateRandomUsIp()) : '';
        url += this.firstPartyData.pid ? '&pid=' + encodeURIComponent(this.firstPartyData.pid) : '';
        url += this.firstPartyData.dbsaved ? '&dbsaved=' + encodeURIComponent(this.firstPartyData.dbsaved) : '';
        url += this.firstPartyData.pcid ? '&iiqidtype=2&iiqpcid=' + encodeURIComponent(this.firstPartyData.pcid) : '';
        url += this.firstPartyData.pcidDate ? '&iiqpciddate=' + encodeURIComponent(this.firstPartyData.pcidDate) : '';
        return url;
    };

    this.containsEids = function (object) {
        let result = false;
        try {
            result =
                ('data' in object) &&
                ('eids' in object.data) &&
                Array.isArray(object.data.eids) &&
                (object.data.eids.length > 0)

        }
        catch (e) { }
        return result;
    };

    /**
     * Load the partner data from localstorage or return and empty object
     * @returns {any}
     */
    this.loadPartnerData = function () {
        let partnerData = this.tryParse(this.readData(this.PARTNER_DATA_KEY));
        if (partnerData) {
            if (partnerData.data)
                this.intentIqData = partnerData.data;
            if (typeof partnerData.callCount === 'number') {
                this.callCount = partnerData.callCount;
            }
            if (typeof partnerData.failCount === 'number') {
                this.failCount = partnerData.failCount;
            }
            if (typeof partnerData.noDataCounter === 'number') {
                this.noDataCounter = partnerData.noDataCounter;
            }
            if (partnerData.date) {
                this.shouldCallServer = Date.now() - partnerData.date > this.currentDataTTl;
            }
            if (typeof partnerData.cttl === 'number') {
                this.currentDataTTl = partnerData.cttl;
                this.logger("Custom data TTL present, value: " + this.currentDataTTl)
            }
            this.logger("Data read: " + JSON.stringify(partnerData));
        } else {
            partnerData = {};
            this.shouldCallServer = true;
        }
        return partnerData;
    }

    /**
     * Load the first party data from localstorage or create a new one
     */
    this.loadOrCreateFirstPartyData = function () {
        let firstPartyData = this.tryParse(this.readData(this.FIRST_PARTY_KEY));
        if (!firstPartyData || !firstPartyData.pcid) {
            const firstPartyId = this.generateGUID();
            firstPartyData = { 'pcid': firstPartyId, 'pcidDate': Date.now() };
            this.storeData(this.FIRST_PARTY_KEY, JSON.stringify(firstPartyData));
        } else if (firstPartyData && !firstPartyData.pcidDate) {
            firstPartyData.pcidDate = Date.now();
            this.storeData(this.FIRST_PARTY_KEY, JSON.stringify(firstPartyData));
        }

        return firstPartyData;
    }

    /**
     * Create a server request and store the response data
     */
    this.makeServerRequest = function (url) {
        // Date default value is 0 to allow more calls if this call fails
        let updateFirstPartyData = false;
        this.logger('Sending request');
        this.getRequest(url, this.intentIqConfig.timeoutInMillis, (response) => {
            let respJson = this.tryParse(response);
            // If response is a valid json and should save is true
            if (respJson) {
                // Save timestamp of the current request
                this.partnerData.date = Date.now();

                // Store firstPartyData fields if found in response json
                if ('pid' in respJson) {
                    this.firstPartyData.pid = respJson.pid;
                    updateFirstPartyData = true;
                }
                if ('dbsaved' in respJson) {
                    this.firstPartyData.dbsaved = respJson.dbsaved;
                    updateFirstPartyData = true;
                }
                if ('cttl' in respJson) {
                    this.currentDataTTl = respJson.cttl;
                    this.logger("Received custom TTL from server, value: " + this.currentDataTTl)
                }
                else {
                    this.currentDataTTl = this.intentIqConfig.refreshInMillis;
                    this.logger("No custom TTL from server, setting customers value: " + this.currentDataTTl)
                }


                this.clearCounters();

                if (!this.containsEids(respJson)) {
                    this.noDataCounter = this.noDataCounter + 1;
                }

                if (respJson.ls) {
                    this.partnerData.data = respJson.data;
                    this.intentIqData = respJson.data;
                }
                this.logger('Received Data: ' + JSON.stringify(respJson));
            }

            if (updateFirstPartyData)
                this.storeData(this.FIRST_PARTY_KEY, JSON.stringify(this.firstPartyData));

            this.savePartnerDataToLocalStore();

            // Use callback method if exists
            if (this.intentIqConfig.callback && !this.wasCallbackFired) {
                this.intentIqConfig.callback(this.intentIqData);
                this.wasCallbackFired = true;
            }
        })
    };

    /**
     * Update the partner data in the local storage, to reflect the current counters into the store
     */
    this.savePartnerDataToLocalStore = function () {
        if (!this.partnerData) {
            this.partnerData = this.tryParse(this.readData(this.PARTNER_DATA_KEY));
        }

        if (this.partnerData) {
            this.partnerData.callCount = this.callCount;
            this.partnerData.failCount = this.failCount;
            this.partnerData.noDataCounter = this.noDataCounter;
            this.partnerData.cttl = this.currentDataTTl;
            this.storeData(this.PARTNER_DATA_KEY, JSON.stringify(this.partnerData));
        }
    }


    /**
     * Do not use as a replacement for (typeof val !== "undefined") -
     * works only for undefined function arguments and undefined properties
     * @param val
     * @returns {Boolean}
     */
    this.isDefined = function (val) {
        return (typeof val !== "undefined" && val != null);
    }

    /**
     * Checks if the object/array is empty or null
     * @param val
     * @returns {boolean}
     */
    this.isEmptyObjAndArray = function (val) {
        return !val || (typeof val == "object" && this.isEmpty(val));
    }

    /**
     * Checks whether an object is empty or not
     * @param obj
     * @returns {boolean}
     */
    this.isEmpty = function (obj) {
        for (let prop in obj) {
            if (obj.hasOwnProperty(prop))
                return false;
        }

        return true;
    }


    /* #endregion*/

    /*  #region pixel */

    /**
     * Append the pixel image to the page
     * @param imageSrc
     */
    this.appendImage = function (imageSrc) {
        if (this.isDefined(imageSrc)) {
            let img = document.createElement("img");
            img.src = imageSrc;
            img.width = 1;
            img.height = 1;
            document.body.appendChild(img);
        }
    }

    this.appendPartnersFirsyParty = function (url) {
        try {
            if (this.intentIqConfig.partnerClientIdType === -1)
                return url;
            if (this.intentIqConfig.partnerClientId !== '') {
                url = url + '&pcid=' + this.intentIqConfig.partnerClientId;
                url = url + '&idtype=' + this.intentIqConfig.partnerClientIdType;
            }
        } catch (e) {
            this.logger(e);
        }
        return url;
    }

    /**
       * Build the url for the server request
       * @param firstPartyData
       * @returns {string}
       */
    this.createPixelUrl = function () {
        let url = this.intentIqConfig.iiqPixelServerAddress + `/profiles_engine/ProfilesEngineServlet?at=20&mi=10&secure=1`;
        url += '&dpi=' + this.intentIqConfig.partner;//this.intentIqSyncPartnerId;
        url += '&rnd=' + this.getRandom(0, 1000000);
        url = this.appendFirstPartyDataToUrl(url);
        url = this.addUniquenessToUrl(url);
        url = this.addMetaData(url);
        url = this.appendPartnersFirsyParty(url);
        return url;
    };

    /**
     * Sync ids with IntentIQ server.
     */
    this.pixelSync = function () {
        try {
            let lastSyncDate = this.readData(this.LAST_SYNC_KEY);
            if (!lastSyncDate || Date.now() - lastSyncDate > this.syncRefreshMillis) {
                let pixelUrl = this.createPixelUrl();
                this.appendImage(pixelUrl);
                this.storeData(this.LAST_SYNC_KEY, Date.now() + "");
            }
        } catch (e) {
            this.logger("Error adding pixel to DOM " + e)
        }
    };

    /**
     *
     * @param start ,inclusive, must be a positive int
     * @param end ,inclusive, must be a positive int >= start
     */
    this.getRandom = function (start, end) {
        return Math.floor((Math.random() * (end - start + 1)) + start);
    }


    /*  #endregion */

    /* #region EIDS */

    /**
     * Resolve intent iq id data
     * @returns {{}}
     */
    this.getIntentIqData = function () {
        try {
            if (this.intentIqConfig.mode === this.pixelOperationalMode) {
                return {};
            }

            if (typeof this.intentIqConfig.partner !== 'number') {
                this.failCount++;
                this.logger('intentIqId requires a valid partner to be defined');
                return {};
            }

            // Read Intent IQ 1st party id or generate it if none exists
            this.partnerData = this.loadPartnerData();

            // To avoid counting call that came from the constructor
            if (!this.wasCallFromConstructor) {
                this.wasCallFromConstructor = true;
            } else {
                this.callCount++;

                if (!this.containsEids(this.partnerData)) {
                    this.noDataCounter = this.noDataCounter + 1;
                }

            }

            // Get data from server
            if (this.shouldCallServer && !this.wasServerCalled) {
                // Allow server call only from constructor
                this.wasServerCalled = true;
                let url = this.createRequestUrl();
                this.makeServerRequest(url);
            } else {
                this.savePartnerDataToLocalStore();
            }

            // Use the callback method with saved partner data if it exists (only once)
            let allowCallbackTrigger = !this.isEmptyObjAndArray(this.intentIqData) || !this.shouldCallServer;
            if (this.intentIqConfig.callback && !this.wasCallbackFired && allowCallbackTrigger) {
                this.intentIqConfig.callback(this.intentIqData);
                this.wasCallbackFired = true;
            }

            return this.intentIqData || {};
        } catch (e) {
            this.failCount++;
            this.logger('Exception occurred during main logic: ' + e);
            this.savePartnerDataToLocalStore();
        }
        return {};
    };

    /**
     * Get the data as eids, use only if your partner is configured to support this.
     */
    this.getIntentIqEids = function () {
        try {
            if (intentIqObject.intentIqConfig.mode === intentIqObject.pixelOperationalMode) {
                return [];
            }
            let data = intentIqObject.getIntentIqData();
            if (data && data.eids) {
                return data.eids;
            }
        } catch (e) {
            intentIqObject.failCount++;
            intentIqObject.logger('Parse response eids got exception');
            intentIqObject.savePartnerDataToLocalStore();
        }
        return [];
    };

    /* #endregion */

    /* #region request enrichment */

    /**
     * Performs enrichment for requests sent from prebid
     * @param requests
     */
    this.enrichRequests = function (reqs) {
        try {
            if (this.intentIqConfig.mode === this.pixelOperationalMode) {
                return reqs;
            }
            if (!this.intentIqConfig.enhanceRequests) {
                this.logger('Enrichment is turned off')
                return reqs;
            }
            let requests = JSON.parse(JSON.stringify(reqs));
            this.logger('======Staring eids enrichment===');

            if (Array.isArray(requests)) {
                requests.forEach(req => {
                    this.requestEnhancer(req)
                });
            } else if ('method' in requests) {
                this.requestEnhancer(requests);
            }
            this.logger(requests);
            this.logger('======Done eids enrichment===');
            return requests;
        } catch (e) {
            this.logger(e);
            return reqs;
        }
    }

    /**
     * Enriches individual request
     * @param outerRequest
     */
    this.requestEnhancer = function (outerRequest) {
        let bidUserIdAsEids = [];
        try {
            bidUserIdAsEids = this.getIntentIqEids();
        } catch (e) {
            this.logger(e);
            return;
        }
        if (!bidUserIdAsEids || !Array.isArray(bidUserIdAsEids) || bidUserIdAsEids.length == 0) {
            this.logger('Failed to get EIDS');
            if (this.isDebug()) {
                bidUserIdAsEids = [
                    {
                        source: 'domain.com',
                        uids: [
                            {
                                id: 'value read from cookie or local storage',
                                atype: 1,
                                ext: {
                                    stype: 'ppuid' // allowable options are sha256email, DMP, ppuid for now
                                }
                            }
                        ]
                    },
                    {
                        source: '3rdpartyprovided.com',
                        uids: [
                            {
                                id: 'value read from cookie or local storage',
                                atype: 3,
                                ext: {
                                    type: 'sha256email'
                                }
                            }
                        ]
                    }
                ]
            } else {
                return;
            }
        }
        this.logger('Adding eids - ' + bidUserIdAsEids);
        try {
            if (!('method' in outerRequest)) {
                this.logger('Method field not found. Unsupported format. ');
                return;
            }
        } catch (e) {
            this.logger(e);
            return;
        }
        switch (outerRequest.method) {
            case 'POST':
                this.logger('Enriching POST');

                this.logger('Updating data filed')
                try {
                    var tempD = outerRequest.data;
                    var stringPreffix = '';
                    if (outerRequest.data.startsWith('"')) {
                        tempD = tempD.substring(1, tempD.length - 1);
                        stringPreffix = '"';
                    }
                    let d = JSON.parse(tempD);
                    if (!('user' in d)) {
                        d.user = { eids: [] }
                    }
                    if (!('eids' in d.user)) {
                        d.user.eids = [];
                    }
                    d.user.eids = d.user.eids.concat(bidUserIdAsEids);
                    outerRequest.data = stringPreffix + JSON.stringify(d) + stringPreffix;
                } catch (e) {
                    this.logger(e);
                }
                this.logger('Updating request data.')
                try {
                    if (!('bidderRequest' in outerRequest)) {
                        this.logger('Failed to find bidderRequest');
                        return;
                    }
                } catch (e) {
                    this.logger(e);
                    return;
                }
                try {
                    if (('bids' in outerRequest.bidderRequest) && Array.isArray(outerRequest.bidderRequest.bids)) {
                        outerRequest.bidderRequest.bids.forEach(bid => {
                            if ('userId' in bid) {
                                if ('pubProvidedId' in bid.userId) {
                                    if (Array.isArray(bid.userId.pubProvidedId)) {
                                        bid.userId.pubProvidedId = bid.userId.pubProvidedId.concat(bidUserIdAsEids);
                                    }
                                } else {
                                    bid.userId.pubProvidedId = bidUserIdAsEids;
                                }
                            } else {
                                this.logger('UserIds not found - adding');
                                bid.userId = {};
                                bid.userId.pubProvidedId = bidUserIdAsEids;
                            }
                            if ('userIdAsEids' in bid) {
                                if (Array.isArray(bid.userIdAsEids)) {
                                    bid.userIdAsEids = bid.userIdAsEids.concat(bidUserIdAsEids);
                                }
                            } else {
                                this.logger('userIdAsEids not found - adding')
                                bid.userIdAsEids = bidUserIdAsEids;
                            }
                        });
                    }
                } catch (e) {
                    this.logger(e);
                    return;
                }
                break;
            case 'GET':
                this.logger('GET request skipped - currently not supported');
                break;
        }
        this.logger('Enchanted request: ' + outerRequest.bidderRequest);
    }

    /* #endregion */

    this.firstPartyData = this.loadOrCreateFirstPartyData();
    // Init the IntentIQ id if it was configured to do so
    this.getIntentIqData();
    // Append the IntentIQ pixel to the page
    if (this.intentIqConfig.mode !== this.vrOperationalMode)
        this.pixelSync();


}