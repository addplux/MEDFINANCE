const url = require('url');

const testString = (str) => {
  const parsed = url.parse(str);
  console.log(`String: ${str}`);
  console.log(`Protocol: ${parsed.protocol}`);
  console.log('---');
};

testString('"postgresql://foo"');
testString("'postgresql://foo'");
testString('postgresql://foo');
