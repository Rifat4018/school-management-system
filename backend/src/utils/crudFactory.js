// Generic CRUD controllers so simple resources (classes, subjects, fees, notices)
// do not repeat the same list/get/create/update/delete code (DRY).
const asyncHandler = require('./asyncHandler');
const ApiError = require('./ApiError');
const { pick, escapeRegex, getPaging, paginationMeta } = require('./helpers');

module.exports = function crudFactory(Model, options = {}) {
  const {
    fields = [], // body fields a client is allowed to set
    populate, // referenced documents to join
    searchFields = [], // fields matched by ?search=
    filterFields = [], // exact-match query filters, e.g. ?status=paid
    sort = '-createdAt',
    scope, // async (req, filter) => {} - restrict what this user may see
    beforeCreate, // async (req, body) => {}
    beforeDelete, // async (req) => {}
  } = options;

  const withPopulate = (query) => (populate ? query.populate(populate) : query);
  const notFound = () => new ApiError(404, `${Model.modelName} not found`);

  const getAll = asyncHandler(async (req, res) => {
    const paging = getPaging(req.query);
    const filter = {};

    // Only plain strings are accepted, so ?status[$ne]=x cannot inject a Mongo operator.
    for (const f of filterFields) {
      if (typeof req.query[f] === 'string' && req.query[f]) filter[f] = req.query[f];
    }
    if (typeof req.query.search === 'string' && req.query.search && searchFields.length) {
      const rx = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = searchFields.map((f) => ({ [f]: rx }));
    }
    if (scope) await scope(req, filter);

    const [data, total] = await Promise.all([
      withPopulate(Model.find(filter)).sort(sort).skip(paging.skip).limit(paging.limit),
      Model.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: paginationMeta(paging, total) });
  });

  const getOne = asyncHandler(async (req, res) => {
    const filter = { _id: req.params.id };
    if (scope) await scope(req, filter);
    const doc = await withPopulate(Model.findOne(filter));
    if (!doc) throw notFound();
    res.json({ success: true, data: doc });
  });

  const create = asyncHandler(async (req, res) => {
    const body = pick(req.body, fields);
    if (beforeCreate) await beforeCreate(req, body);
    const doc = await Model.create(body);
    if (populate) await doc.populate(populate);
    res.status(201).json({ success: true, data: doc });
  });

  const update = asyncHandler(async (req, res) => {
    const doc = await withPopulate(
      Model.findByIdAndUpdate(req.params.id, pick(req.body, fields), { new: true, runValidators: true })
    );
    if (!doc) throw notFound();
    res.json({ success: true, data: doc });
  });

  const remove = asyncHandler(async (req, res) => {
    if (beforeDelete) await beforeDelete(req);
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) throw notFound();
    res.json({ success: true, message: `${Model.modelName} deleted` });
  });

  return { getAll, getOne, create, update, remove };
};
