const Job = require('../models/Job')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')

/*   const getAllJobs = async (req, res) => {
  const jobs = await Job.find({ createdBy: req.user.userId }).sort('createdAt')
  res.status(StatusCodes.OK).json({ jobs, count: jobs.length })
}   */

// GET ALL JOBS (Search + Filter + Pagination + Sort)
const getAllJobs = async (req, res) => {
  const { status, search, sort, page = 1, limit = 10 } = req.query

  const queryObject = {
    createdBy: req.user.userId,
  }

  // filter by status
  if (status) {
    queryObject.status = status
  }

  // search by company or position
  if (search) {
    queryObject.$or = [
      { company: { $regex: search, $options: 'i' } },
      { position: { $regex: search, $options: 'i' } },
    ]
  }

  let result = Job.find(queryObject)

  // sorting
  if (sort === 'latest') {
    result = result.sort('-createdAt')
  } else if (sort === 'oldest') {
    result = result.sort('createdAt')
  } else if (sort === 'a-z') {
    result = result.sort('company')
  } else if (sort === 'z-a') {
    result = result.sort('-company')
  } else {
    result = result.sort('createdAt')
  }

  // pagination
  const pageNumber = Number(page)
  const limitNumber = Number(limit)
  const skip = (pageNumber - 1) * limitNumber

  result = result.skip(skip).limit(limitNumber)

  const jobs = await result
  const totalJobs = await Job.countDocuments(queryObject)
  const numOfPages = Math.ceil(totalJobs / limitNumber)

  res.status(StatusCodes.OK).json({
    jobs,
    totalJobs,
    numOfPages,
    currentPage: pageNumber,
  })
}

// GET SINGLE JOB
const getJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req

  const job = await Job.findOne({
    _id: jobId,
    createdBy: userId,
  })
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  res.status(StatusCodes.OK).json({ job })
}

// CREATE JOB
const createJob = async (req, res) => {
  req.body.createdBy = req.user.userId
  const job = await Job.create(req.body)
  res
    .status(StatusCodes.CREATED)
    .json({ msg: "Job created successfully", job });
}

// UPDATE JOB
const updateJob = async (req, res) => {
  const {
    body: { company, position },
    user: { userId },
    params: { id: jobId },
  } = req

  if (company === '' || position === '') {
    throw new BadRequestError('Company or Position fields cannot be empty')
  }
  const job = await Job.findByIdAndUpdate(
    { _id: jobId, createdBy: userId },
    req.body,
    { new: true, runValidators: true }
  )
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  res.status(StatusCodes.OK).json({ msg: "Job updated successfully", job });
}

// DELETE JOB
const deleteJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req

  const job = await Job.findByIdAndRemove({
    _id: jobId,
    createdBy: userId,
  })
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  // res.status(StatusCodes.OK).send()
  res.status(StatusCodes.OK).json({ msg: "The entry was deleted." });
}

module.exports = {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
}
