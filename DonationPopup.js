(function (window, document) {
    let config = window.DOP_config || {};
    config = Object.assign({},
        {
            visits: 10,// Number of visits required for the popup to first show up
            timeout: 24,// Timeout for the 'remind later' option in hours
            text: "Hey there, sorry for the interruption!\nIt looks like you've visited this site a couple of times - if you like it and want to help keep it running, please consider throwing over a small donation :)",// Text of the popup
            postponeText: "Maybe Later",// Text on the 'remind me later' button
            dismissText: "Never!",// Text on the dismiss button
            color: "#9c9c9c",// Background color
            textColor: "#1c1c1c",// Text color
            linkColor: "#0063d6",// Link color (remind later, dismiss)
            position: "bottom-right",// Position of the popup
            enableAnalytics: false,// Toggle Google Analytics - will send a custom event on clicks if enabled
            cookieTime: 30,// Cookie expiration time in days
            baseStyle: "position: fixed; border-radius: 20px; padding: 10px; font-family: Consolas, monospace; max-width: 30vmax; z-index: 10000;",
            buttonStyle: "padding: 2px;",
            buttonImgStyle: "max-height: 40px;",
            cross: "X",
            crossStyle: "position: absolute; top: 5px; right: 10px; text-decoration: none;",
            edgeDistance: 10,
            buttonTarget: "_blank",
            buttons: {
                paypal: "https://www.paypalobjects.com/digitalassets/c/website/marketing/apac/C2/logos-buttons/optimize/44_Grey_PayPal_Pill_Button.png",
                patreon: "https://c5.patreon.com/external/logo/become_a_patron_button.png",
                donorbox: "https://d1iczxrky3cnb2.cloudfront.net/button-medium-blue.png",
                kofi: "https://az743702.vo.msecnd.net/cdn/kofi1.png?v=2"
            },
            links: {
                paypal: "",
                patreon: "",
                donorbox: "",
                kofi: "",
                custom: null // can be a function to add custom HTML
            }
        }, config);
    window.DOP_config = config;

    // Get cookie data or make a new one
    let cookie = JSON.parse(getCookie("DOP_info") || '[0,0,0]');
    let visits = cookie[0];
    let status = cookie[1];// 0 = pending, 1 = asked, 2 = clicked, 3 = postponed, 4 = dismissed
    let time = cookie[2];

    // increase visit count right away
    visits++;

    if (visits > config.visits) {// check if the visits are higher than the configured threshold
        if (status === 0 || status === 1) {// display directly if 'pending' or 'asked'
            displayPopup();
        } else if (status === 3 && Date.now() - time > config.timeout * 60 * 60 * 1000) {// if 'postponed', check if the timeout has passed before displaying
            displayPopup();
        }

        if (status === 0) status = 1;// Set to 'asked' if 'pending'
    }

    // Click-handler function used by the generated elements
    window.DOP_config.clk = function (clickType, extra) {
        status = clickType;
        if (status === 3) {// set timer if 'postponed'
            time = Date.now();
        }
        setCookie("DOP_info", JSON.stringify([visits, status, time]), config.cookieTime);
        document.body.removeChild(document.getElementById(window.DOP_config.elid));

        if (config.enableAnalytics && typeof ga === "function") {
            if (ga.hasOwnProperty("getAll")) {// https://stackoverflow.com/a/40761709/6257838
                let allTrackers = ga.getAll();
                if (allTrackers && allTrackers.length > 0) {
                    allTrackers[0].send("event", "DonationPopup", status === 2 ? "clicked" : status === 3 ? "postponed" : "dismissed", extra);
                }
            }
            ga("send", "event", "DonationPopup", status === 2 ? "clicked" : status === 3 ? "postponed" : "dismissed", extra);
        }
    };

    // Update cookie
    setCookie("DOP_info", JSON.stringify([visits, status, time]), config.cookieTime);

    // Function to display the popup
    function displayPopup() {
        let style = config.baseStyle;
        style += "background-color: " + config.color + ";";

        switch (config.position) {
            case "top-left":
                style += "top: " + config.edgeDistance + "px; left: " + config.edgeDistance + "px;";
                break;
            case "top-right":
                style += "top: " + config.edgeDistance + "px; right: " + config.edgeDistance + "px;";
                break;
            case "bottom-left":
                style += "bottom: " + config.edgeDistance + "px; left: " + config.edgeDistance + "px;";
                break;
            case "bottom-right":
            default:
                style += "bottom: " + config.edgeDistance + "px; right: " + config.edgeDistance + "px;";
                break;
        }

        // Text block
        let html = "<p style='color: " + config.textColor + ";'>" + config.text.replace("\n", "<br/>") + "</p>";
        html += "<a style='" + config.crossStyle + "' href='#' onclick='DOP_config.clk(3)'>" + config.cross + "</a>";
        html += "<div>";

        // Buttons
        if (typeof config.links.custom === "function") {// Custom Button HTML
            html += config.links.custom(config, cookie) || "";
        }

        // Predefined buttons
        let buttonStyle = config.buttonStyle;
        let imgStyle = config.buttonImgStyle;
        if (config.links.paypal) {
            html += "<a onclick='DOP_config.clk(2,\"paypal\")' style='" + buttonStyle + "' target='" + config.buttonTarget + "' href='" + addUrlParams(new URL(config.links.paypal)).href + "'><img style='" + imgStyle + "' alt='PayPal' src='" + config.buttons.paypal + "'></a>";
        }
        if (config.links.patreon) {
            html += "<a onclick='DOP_config.clk(2,\"patreon\")' style='" + buttonStyle + "' target='" + config.buttonTarget + "' href='" + addUrlParams(new URL(config.links.patreon)).href + "'><img style='" + imgStyle + "' alt='Patreon' src='" + config.buttons.patreon + "'></a>";
        }
        if (config.links.donorbox) {
            html += "<a onclick='DOP_config.clk(2,\"donorbox\")' style='" + buttonStyle + "' target='" + config.buttonTarget + "' href='" + addUrlParams(new URL(config.links.donorbox)).href + "'><img style='" + imgStyle + "' alt='Donorbox' src='" + config.buttons.donorbox + "'></a>";
        }
        if (config.links.kofi) {
            html += "<a onclick='DOP_config.clk(2,\"kofi\")' style='" + buttonStyle + "' target='" + config.buttonTarget + "' href='" + addUrlParams(new URL(config.links.kofi)).href + "'><img style='" + imgStyle + "' alt='kofi' src='" + config.buttons.kofi + "'></a>";
        }

        // Remind later / Dismiss buttons
        html += "</div><div style='float: right; padding-top: 4px;'>";
        html += "<a href='#' style='color: " + config.linkColor + ";' onclick='DOP_config.clk(3)'>" + config.postponeText + "</a>&nbsp;&nbsp;<a href='#' style='color: " + config.linkColor + ";' onclick='DOP_config.clk(4)'>" + config.dismissText + "</a>";
        html += "</div>";


        let el = document.createElement("div");
        window.DOP_config.elid = el.id = "DOP" + Date.now();
        el.style = style;
        el.innerHTML = html;
        document.body.appendChild(el);
    }

    function addUrlParams(url) {
        if (!url) return url;
        if (config.enableAnalytics) {
            // Analytics stuff, useful for Patreon's tracking
            url.searchParams.append("utm_medium", "DonationPopup");
            url.searchParams.append("utm_source", window.location.hostname);
        }
        return url;
    }

    // https://www.w3schools.com/js/js_cookies.asp
    function setCookie(cname, cvalue, exdays) {
        let d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        let expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    // https://www.w3schools.com/js/js_cookies.asp
    function getCookie(cname) {
        let name = cname + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
})(window, document);
