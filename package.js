Package.describe({
  summary: "Access Google Data Service oauth By ServiceAccount"
});

/**
 * Ex: Some NPM Dependencies
*/
Npm.depends({
  'request': '2.31.0'
});

/**
* On use we'll add files and export our tool
*/
Package.on_use(function (api) {
  /**
   * Add all the files, in the order of their dependence (eg, if A.js depends on B.js, B.js must be before A.js)
   */
  // <-- include all the necessary files in the package,
  api.add_files('goauth.js', 'server');   // Can be 'server', 'client' , ['client','server']

  /**
   * Only expose the My constructor, only export if meteor > 6.5
   */
  if (api.export) {
    api.export(['GoogleOauthServiceAccount'], 'server'); // 1st arg can be array of exported constructors/objects, 2nd can be 'server', 'client', ['client', 'server']
  }
});
