function querySetOptions() {
  this.setOptions({ new: true, runValidators: true });
}

exports.updateOpSetOptions = function (schema) {
  schema.pre("findOneAndUpdate", querySetOptions);
  schema.pre("updateMany", querySetOptions);
  schema.pre("updateOne", querySetOptions);
};

exports.schemaSetOptions = function (schema) {
  schema.set("toJSON", { getters: true });
  schema.set("toObject", { getters: true });
  schema.set("timestamps", { createdAt: "created_at", updatedAt: "updated_at" });
};
