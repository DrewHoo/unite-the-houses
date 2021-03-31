let {MY_CONSTANT} = require('./other');

const mutateConstant = () => {
  console.log('mutate constant', MY_CONSTANT, MY_CONSTANT.prototype);
  MY_CONSTANT[2] = 'd';
  console.log('mutated constant', MY_CONSTANT)
}

module.exports = {
  mutateConstant
}
