const { app } = require("../app");
const Job = require("../models/Job")
const { seed_db, testUserPassword, factory } = require("../util/seed_db");
const get_chai = require("../util/get_chai");

describe("Job CRUD operations", function () {
    // Seed DB and logon before any test
  before(async () => {
    const { expect, request } = await get_chai();
    // Seed DB with test user and jobs
    this.test_user = await seed_db();
    // Get CSRF token and cookie from logon page
    let req = request.execute(app).get("/session/logon").send();
    let res = await req;
    const textNoLineEnd = res.text.replaceAll("\n", "");
    this.csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd)[1];
    let cookies = res.headers["set-cookie"];
    this.csrfCookie = cookies.find((element) =>
      element.startsWith("csrfToken"),
    );
    // Post logon data
    const dataToPost = {
      email: this.test_user.email,
      password: testUserPassword,
      _csrf: this.csrfToken,
    };
    req = request
      .execute(app)
      .post("/session/logon")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);
    res = await req;
    cookies = res.headers["set-cookie"];
    this.sessionCookie = cookies.find((element) =>
      element.startsWith("connect.sid"),
    );
    // Verify everything is set up correctly
    expect(this.csrfToken).to.not.be.undefined;
    expect(this.sessionCookie).to.not.be.undefined;
    expect(this.csrfCookie).to.not.be.undefined;
  });

  it("should get the job list", async () => {
    const { expect, request } = await get_chai();
    const res = await request
      .execute(app)
      .get("/jobs")
      .set("Cookie", this.csrfCookie + ";" + this.sessionCookie)
      .send();

    expect(res).to.have.status(200);

    // Count <tr> rows in HTML
    const pageParts = res.text.split("<tr>");
    // Seed added 20 jobs, +1 for header row
    expect(pageParts.length).to.equal(21);
  });

  it("should add a job entry", async () => {
    const { expect, request } = await get_chai();

    // Generate job data with factory
    const newJob = await factory.build("job");

    const dataToPost = {
      company: newJob.company,
      position: newJob.position,
      status: newJob.status,
      _csrf: this.csrfToken,
    };

    const res = await request
      .execute(app)
      .post("/jobs")
      .set("Cookie", this.csrfCookie + ";" + this.sessionCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);

    expect(res).to.have.status(302); // Redirect to job list

    const jobs = await Job.find({ createdBy: this.test_user._id });
    expect(jobs.length).to.equal(21); // 20 seeded + 1 new
  });

  it("should update a job entry", async () => {
    const { expect, request } = await get_chai();

    // Pick first job
    const job = await Job.findOne({ createdBy: this.test_user._id });

    const updatedData = {
      company: job.company + " Inc",
      position: job.position + " Senior",
      status: "interview",
      _csrf: this.csrfToken,
    };

    const res = await request
      .execute(app)
      .post(`/jobs/${job._id}/edit`)
      .set("Cookie", this.csrfCookie + ";" + this.sessionCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(updatedData);

    expect(res).to.have.status(302);

    const updatedJob = await Job.findById(job._id);
    expect(updatedJob.company).to.equal(updatedData.company);
    expect(updatedJob.position).to.equal(updatedData.position);
    expect(updatedJob.status).to.equal(updatedData.status);
  });

  it("should delete a job entry", async () => {
    const { expect, request } = await get_chai();

    // Pick first job
    const job = await Job.findOne({ createdBy: this.test_user._id });

    const res = await request
      .execute(app)
      .post(`/jobs/${job._id}/delete`)
      .set("Cookie", this.csrfCookie + ";" + this.sessionCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .send({ _csrf: this.csrfToken });

    expect(res).to.have.status(302);

    const deletedJob = await Job.findById(job._id);
    expect(deletedJob).to.be.null;
  });
});