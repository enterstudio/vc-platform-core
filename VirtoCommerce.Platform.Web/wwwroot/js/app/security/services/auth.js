angular.module('platformWebApp')
    .factory('platformWebApp.authService', ['$http', '$rootScope', '$cookieStore', '$state', '$interpolate', function ($http, $rootScope, $cookieStore, $state, $interpolate) {
    var serviceBase = 'api/platform/security/';
    var authContext = {
        userId: null,
        userLogin: null,
        fullName: null,
        permissions: null,
        isAuthenticated: false
    };

    authContext.fillAuthData = function () {
        return $http.get(serviceBase + 'currentuser').then(
			function (results) {
			    changeAuth(results.data);
			});
    };

    authContext.login = function (email, password, remember) {       
        return $http.post(serviceBase + 'login/', { userName: email, password: password, rememberMe: remember }).then(
            function (results) {
                if (results.data.succeeded) {
                    return authContext.fillAuthData().then(function () { return authContext.isAuthenticated; })
                }
                return false;
			});
    };

    authContext.requestpasswordreset = function (data) {
        return $http.post(serviceBase + 'users/' + data.userName + '/requestpasswordreset/').then(
			function (results) {
			    return results.data;
			});
    };

    authContext.resetpassword = function (data) {
        return $http.post(serviceBase + 'users/' + data.userId + '/resetpasswordconfirm', { token: data.code, newPassword: data.newPassword }).then(
			function (results) {
			    return results.data;
			});
    };

    authContext.logout = function () {
        changeAuth({});

        $http.get(serviceBase + 'logout/').then(function (result) {
        });
    };

    authContext.checkPermission = function (permission, securityScopes) {
        //first check admin permission
        // var hasPermission = $.inArray('admin', authContext.permissions) > -1;
        var hasPermission = authContext.isAdministrator;
        if (!hasPermission && permission) {
            permission = permission.trim();
            //first check global permissions
            hasPermission = $.inArray(permission, authContext.permissions) > -1;
            if (!hasPermission && securityScopes) {
                if (typeof securityScopes === 'string' || angular.isArray(securityScopes)) {
                    securityScopes = angular.isArray(securityScopes) ? securityScopes : securityScopes.split(',');
                    //Check permissions in scope
                    hasPermission = _.some(securityScopes, function (x) {
                        var permissionWithScope = permission + ":" + x;
                        var retVal = $.inArray(permissionWithScope, authContext.permissions) > -1;
                        //console.log(permissionWithScope + "=" + retVal);
                        return retVal;
                    });
                }
            }
        }
        return hasPermission;
    };

    function changeAuth(user) {
        authContext.userId = user.id;
        authContext.permissions = user.permissions;
        authContext.userLogin = user.userName;
        authContext.fullName = user.userLogin;
        authContext.isAuthenticated = user.userName != null;
        authContext.userType = user.userType;
        authContext.isAdministrator = user.isAdministrator;
        //Interpolate permissions to replace some template to real value
        if (authContext.permissions) {
            authContext.permissions = _.map(authContext.permissions, function (x) {
                return $interpolate(x)(authContext);
            });
        }
        $rootScope.$broadcast('loginStatusChanged', authContext);
    }
    return authContext;
}]);
