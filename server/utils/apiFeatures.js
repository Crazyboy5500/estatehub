class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excluded = ['page', 'limit', 'sort', 'fields', 'keyword', 'minPrice', 'maxPrice', 'minArea', 'maxArea'];
    excluded.forEach((k) => delete queryObj[k]);
    this.query = this.query.find(queryObj);
    return this;
  }

  rangeFilter() {
    const { minPrice, maxPrice, minArea, maxArea } = this.queryString;
    const range = {};
    if (minPrice || maxPrice) {
      range.price = {};
      if (minPrice) range.price.$gte = Number(minPrice);
      if (maxPrice) range.price.$lte = Number(maxPrice);
    }
    if (minArea || maxArea) {
      range.area = {};
      if (minArea) range.area.$gte = Number(minArea);
      if (maxArea) range.area.$lte = Number(maxArea);
    }
    this.query = this.query.find(range);
    return this;
  }

  keyword() {
    if (this.queryString.keyword) {
      this.query = this.query.find({
        $text: { $search: this.queryString.keyword },
      });
    }
    return this;
  }

  sort() {
    const sortBy = (this.queryString.sort || '-createdAt').replace(/,/g, ' ');
    this.query = this.query.sort(sortBy);
    return this;
  }

  select() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.replace(/,/g, ' ');
      this.query = this.query.select(fields);
    }
    return this;
  }

  paginate() {
    const page = Math.max(Number(this.queryString.page) || 1, 1);
    const limit = Math.min(Math.max(Number(this.queryString.limit) || 9, 1), 100);
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit };
    return this;
  }
}

module.exports = APIFeatures;
