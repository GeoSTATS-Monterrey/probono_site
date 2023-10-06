module.exports = {
  extends: ["plugin:@next/next/recommended", "xo-react"],
  ignores: ["./*"],
  rules: {
    "react/require-default-props": "off",
    "react/proptypes": "off",
    "n/file-extension-in-import": "off",
    "n/prefer-global/process": "off",
    "new-cap": "off",
	  "react/button-has-type": "off",
  },
};
