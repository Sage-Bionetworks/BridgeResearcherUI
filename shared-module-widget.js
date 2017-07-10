var root = document.body.querySelector("script#shared-modules");
function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        xhr = null;
    }
    return xhr;
}
function displayItems(items) {
    if (items.length === 0) {
        var div = document.createElement("div");
        div.setAttribute('data-bridge-sm',true);

        var p = document.createElement("p");
        p.innerText = "There are no shared modules at this time.";
        root.parentNode.insertBefore(p, root);
    }
    items.forEach(function(item) {
        var div = document.createElement("div");
        div.setAttribute('data-bridge-sm',true);
        var hdr = document.createElement("h3");
        hdr.innerText = item.name;
        var body = document.createElement("section");
        body.innerHTML = (item.notes) ? item.notes : "<p class='no-notes'><em>No information available.</em></p>";
        div.appendChild(hdr);
        div.appendChild(body);
        root.parentNode.insertBefore(div, root);
    });
}
var url = 'https://webservices.sagebridge.org/v3/sharedmodules/metadata?mostrecent=true&published=true';
var request = createCORSRequest('GET', url);
if (request) {
    request.setRequestHeader('Content-Type', 'application/json');
    request.send();
    request.onreadystatechange = function() {
        if(request.readyState === 4 && request.status === 200) {
            var object = JSON.parse(request.responseText);
            displayItems(object.items);
        }
    };
}
