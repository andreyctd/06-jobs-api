const puppeteer = require("puppeteer");
require("../app"); // Make sure your app exports { app } without auto-start
const { seed_db, testUserPassword } = require("../util/seed_db");
const Job = require("../models/Job");

let testUser = null;
let browser = null;
let page = null;

describe("puppeteer job operations", function () {
  this.timeout(30000); // Increase timeout for browser actions

  before(async function () {
    // Launch browser and page
    browser = await puppeteer.launch({ headless: true, slowMo: 50 });
    page = await browser.newPage();

    // Seed DB with test user and jobs
    testUser = await seed_db();

    // Go to root page
    await page.goto("http://localhost:3000");

    // Logon
    const emailInput = await page.waitForSelector('input[name="email"]');
    const passwordInput = await page.waitForSelector('input[name="password"]');
    const submitButton = await page.waitForSelector("button ::-p-text(Logon)");

    await emailInput.type(testUser.email);
    await passwordInput.type(testUserPassword);
    await submitButton.click();

    await page.waitForNavigation();
    // Confirm logon
    await page.waitForSelector(`p ::-p-text(${testUser.name} is logged on.)`);
  });

  after(async function () {
    await browser.close();
  });

  it("should open job list and verify 20 entries", async () => {
    const { expect } = await import("chai");

    // Click jobs list link
    const jobsLink = await page.waitForSelector('a[href="/jobs"]');
    await jobsLink.click();
    await page.waitForNavigation();

    // Get page content
    const html = await page.content();

    // Count <tr> rows
    const rows = html.split("<tr>");
    expect(rows.length).to.equal(21); // 20 jobs + header row
  });

  it("should open add job form and verify fields", async () => {
    const { expect } = await import("chai");

    // Click "Add A Job" button
    const addJobBtn = await page.waitForSelector("a ::-p-text(Add A Job)");
    await addJobBtn.click();
    await page.waitForNavigation();

    // Check for form fields
    const companyField = await page.waitForSelector('input[name="company"]');
    const positionField = await page.waitForSelector('input[name="position"]');
    const addBtn = await page.waitForSelector("button ::-p-text(Add)");

    expect(companyField).to.not.be.null;
    expect(positionField).to.not.be.null;
    expect(addBtn).to.not.be.null;
  });

  it("should add a new job and verify it appears", async () => {
    const { expect } = await import("chai");

    // Fill form
    const companyInput = await page.$('input[name="company"]');
    const positionInput = await page.$('input[name="position"]');
    const addButton = await page.$("button ::-p-text(Add)");

    const companyName = "Test Company";
    const positionName = "Test Position";

    await companyInput.type(companyName);
    await positionInput.type(positionName);
    await addButton.click();
    await page.waitForNavigation();

    // Verify success message
    const html = await page.content();
    expect(html).to.include("Job listing has been added");

    // Verify in DB
    const jobs = await Job.find({ createdBy: testUser._id });
    const addedJob = jobs.find(
      (job) => job.company === companyName && job.position === positionName
    );
    expect(addedJob).to.not.be.undefined;
  });
});
