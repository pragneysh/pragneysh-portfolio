function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Check whether the URI has a file extension (e.g. .js, .css, .png, .pdf, .svg, .ico, .json, .txt)
    // Assets with an extension must pass directly to S3 and never be rewritten to index.html.
    if (uri.includes('.')) {
        return request;
    }

    // Root requests pass through to DefaultRootObject (index.html)
    if (uri === '/' || uri === '') {
        return request;
    }

    // Rewrite client-side React Router routes (e.g. /live-projects, /projects/aws-control-center)
    // internally to /index.html before sending the request to the S3 origin.
    request.uri = '/index.html';
    return request;
}
