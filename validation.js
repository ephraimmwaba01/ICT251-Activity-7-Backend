function validated(body) {
  const output = {};
  for (const [key, min, max] of [['title',3,80],['category',2,40],['description',5,300],['status',1,40]]) {
    const value = typeof body?.[key] === 'string' ? body[key].trim() : '';
    if (value.length < min || value.length > max) throw new Error(key[0].toUpperCase()+key.slice(1)+' must have '+min+' to '+max+' characters.');
    output[key] = value;
  }
  if (!['Pending','In progress','Completed'].includes(output.status)) throw new Error('Choose Pending, In progress or Completed.');
  return output;
}
module.exports = validated;
