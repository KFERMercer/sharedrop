window.ShareDrop.App = Ember.Application.create();

ShareDrop.App.config = {
    FIREBASE_URL: "https://sharedrop.firebaseio.com/"
};

ShareDrop.App.deferReadiness();

// Check if everything we need is available
(function () {
    checkWebRTCSupport()
    .then(clearFileSystem)
    .catch(function (error) {
        ShareDrop.App.error = error;
    })
    .then(authenticateToFirebase)
    .then(function () {
        ShareDrop.App.advanceReadiness();
    });

    function checkWebRTCSupport() {
        return new Promise(function (resolve, reject) {
            if (('webkitRTCPeerConnection' in window) && util.supports.sctp) {
                resolve();
            } else {
                reject('browser_unsupported');
            }
        });
    }

    function clearFileSystem() {
        return new Promise(function (resolve, reject) {
            ShareDrop.File.removeAll()
            .then(function () {
                resolve();
            })
            .catch(function () {
                reject('filesystem_unavailable');
            });
        });
    }

    function authenticateToFirebase() {
        return new Promise(function (resolve, reject) {
            var xhr = Ember.$.getJSON('/auth');
            xhr.then(function (data) {
                var token = data.token,
                    ref = new Firebase(ShareDrop.App.config.FIREBASE_URL);
                    ShareDrop.App.ref = ref;

                ref.auth(token, function (error) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        });
    }
})();

ShareDrop.App.IndexRoute = Ember.Route.extend({
    beforeModel: function() {
        if (ShareDrop.App.error) {
            throw new Error(ShareDrop.App.error);
        }
    },

    renderTemplate: function () {
        this.render();

        this.render('about_you', {
            into: 'application',
            outlet: 'about_you'
        });
    }
});

ShareDrop.App.ErrorRoute = Ember.Route.extend({
    renderTemplate: function(controller, error) {
        var name = 'errors/' + error.message,
            template = Ember.TEMPLATES[name];

        if (template) this.render(name);
    }
});
