/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This file tests the API for retrieving meters, by artificially
 * inserting meters prior to executing the test code. */

const { chai, mocha, expect, app, testDB, testUser } = require('../common');
const User = require('../../models/User');
const Configfile = require('../../models/obvius/Configfile');
const bcrypt = require('bcryptjs');
const { insertUnits } = require('../../util/insertData');
const Unit = require('../../models/Unit');

mocha.describe('Obvius API', () => {
	mocha.describe('upload: ', () => {
		mocha.describe('authorized roles (Admin or Obvius):', () => {
			mocha.it('should accept requests from Admin users', async () => {
				const res = await chai.request(app).post('/api/obvius').send({ username: testUser.username, password: testUser.password });
				expect(res).to.have.status(406); // this passes role verification but fails due to improper input
				// test here for backwards compatibility using email parameter
				const res2 = await chai.request(app).post('/api/obvius').send({ email: testUser.username, password: testUser.password });
				expect(res2).to.have.status(406); // this passes role verification but fails due to improper input
			});
			mocha.it('should accept requests from Obvius users', async () => {
				const conn = testDB.getConnection();
				const password = 'password';
				const hashedPassword = await bcrypt.hash(password, 10);
				const obviusUser = new User(undefined, 'obivus@example.com', hashedPassword, User.role.OBVIUS);
				await obviusUser.insert(conn);
				obviusUser.password = password;
				const res = await chai.request(app).post('/api/obvius').send({ username: obviusUser.username, password: obviusUser.password });
				expect(res).to.have.status(406); // this passes role verification but fails due to improper input
				// test here for backwards compatibility using email parameter
				const res2 = await chai.request(app).post('/api/obvius').send({ email: obviusUser.username, password: obviusUser.password });
				expect(res2).to.have.status(406); // this passes role verification but fails due to improper input
			});
		})
		mocha.describe('unauthorized roles:', async () => {
			for (const role in User.role) {
				if (User.role[role] !== User.role.ADMIN && User.role[role] !== User.role.OBVIUS) {
					mocha.it(`should reject requests from ${role}`, async () => {
						const conn = testDB.getConnection();
						const password = 'password';
						const hashedPassword = await bcrypt.hash(password, 10);
						const unauthorizedUser = new User(undefined, `${role}@example.com`, hashedPassword, User.role[role]);
						await unauthorizedUser.insert(conn);
						unauthorizedUser.password = password;
						const res = await chai.request(app).post('/api/obvius').send({ username: unauthorizedUser.username, password: unauthorizedUser.password });
						// request should respond with http code of 401 for failed user
						expect(res).to.have.status(401);
						// Should also return expected message
						expect(res.text).equals("Got request to 'Obvius pipeline' with invalid authorization level. Obvius role is at least required to 'Obvius pipeline'.");
						// test here for backwards compatibility using email parameter
						const res2 = await chai.request(app).post('/api/obvius').send({ email: unauthorizedUser.username, password: unauthorizedUser.password });
						// request should respond with http code of 401 for failed user
						expect(res2).to.have.status(401);
						// Should also return expected message
						expect(res2.text).equals("Got request to 'Obvius pipeline' with invalid authorization level. Obvius role is at least required to 'Obvius pipeline'.");
					})
				}
			}
		});
		mocha.describe('obvius request modes', async () => {
			mocha.beforeEach(async () => {
				const conn = testDB.getConnection();
				// The kWh unit is not used in all tests but easier to just put in.
				const unitData = [
					{
						name: 'kWh',
						identifier: '',
						unitRepresent: Unit.unitRepresentType.QUANTITY,
						secInRate: 3600,
						typeOfUnit: Unit.unitType.UNIT,
						suffix: '',
						displayable: Unit.displayableType.ALL,
						preferredDisplay: true,
						note: 'OED created standard unit'
					}
				];
				await insertUnits(unitData, false, conn);
			});
			mocha.it('should reject requests without a mode', async () => {
				const password = 'password';
				const hashedPassword = await bcrypt.hash(password, 10);
				const obviusUser = new User(undefined, 'obivus@example.com', hashedPassword, User.role.OBVIUS);
				await obviusUser.insert(conn);
				obviusUser.password = password;
				const res = await chai.request(app).post('/api/obvius').send({ username: obviusUser.username, password: obviusUser.password });
				//should respond with 406, not acceptable
				expect(res).to.have.status(406);
				//should also return expected message
				expect(res.text).equals(`<pre>\nRequest must include mode parameter.\n</pre>\n`);
			});
			mocha.it('should accept status requests', async () => {
				const password = 'password';
				const hashedPassword = await bcrypt.hash(password, 10);
				const obviusUser = new User(undefined, 'obivus@example.com', hashedPassword, User.role.OBVIUS);
				await obviusUser.insert(conn);
				obviusUser.password = password;
				const requestMode = 'STATUS';
				const res = await chai.request(app).post('/api/obvius').send({ username: obviusUser.username, password: obviusUser.password, mode: requestMode });
				//should respond with 200, success
				expect(res).to.have.status(200);
				//should also return expected message
				expect(res.text).equals("<pre>\nSUCCESS\n</pre>\n");
			});
			mocha.it('should accept valid logfile uploads', async () => {
				const password = 'password';
				const hashedPassword = await bcrypt.hash(password, 10);
				const obviusUser = new User(undefined, 'obvius@example.com', hashedPassword, User.role.OBVIUS);
				await obviusUser.insert(conn);
				obviusUser.password = password;
				const logfileRequestMode = 'LOGFILEUPLOAD';

				// Adapted from ../obvius/README.md
				const logfilePath = 'src/server/test/web/obvius/mb-001.log.gz';

				//the upload of a logfile is the subject of the test
				const res = await chai.request(app)
					.post('/api/obvius')
					.field('username', obviusUser.username)
					.field('password', obviusUser.password)
					.field('mode', logfileRequestMode)
					.field('serialnumber', 'mb-001')
					.attach('files', logfilePath);
				//should respond with 200, success
				expect(res).to.have.status(200);
				//should also return expected message
				expect(res.text).equals("<pre>\nSUCCESS\nLogfile Upload IS PROVISIONAL</pre>\n");

			});
			mocha.it('should accept valid config file uploads', async () => {
				const password = 'password';
				const hashedPassword = await bcrypt.hash(password, 10);
				const obviusUser = new User(undefined, 'obvius@example.com', hashedPassword, User.role.OBVIUS);
				await obviusUser.insert(conn);
				obviusUser.password = password;
				const requestMode = 'CONFIGFILEUPLOAD';

				// Adapted from ../obvius/README.md
				const configFilePath = 'src/server/test/web/obvius/mb-001.ini.gz';

				const res = await chai.request(app)
					.post('/api/obvius')
					.field('username', obviusUser.username)
					.field('password', obviusUser.password)
					.field('mode', requestMode)
					.field('serialnumber', 'mb-001')
					.field('modbusdevice', '1234')
					.attach('files', configFilePath);

				//should respond with 200, success
				expect(res).to.have.status(200);
				//should also return expected message
				expect(res.text).equals("<pre>\nSUCCESS\nAcquired config log with (pseudo)filename mb-001-mb-1234.ini.</pre>\n");
			});
			mocha.it('should return accurate config file manifests', async () => {
				const password = 'password';
				const hashedPassword = await bcrypt.hash(password, 10);
				const obviusUser = new User(undefined, 'obvius@example.com', hashedPassword, User.role.OBVIUS);
				await obviusUser.insert(conn);
				obviusUser.password = password;
				const uploadRequestMode = 'CONFIGFILEUPLOAD';
				const manifestRequestMode = 'CONFIGFILEMANIFEST';

				// Adapted from ../obvius/README.md
				const configFilePath = 'src/server/test/web/obvius/mb-001.ini.gz';
				const upload = await chai.request(app)
					.post('/api/obvius')
					.field('username', obviusUser.username)
					.field('password', obviusUser.password)
					.field('mode', uploadRequestMode)
					.field('serialnumber', 'mb-001')
					.field('modbusdevice', '1234')
					.attach('files', configFilePath);

				const res = await chai.request(app)
					.post('/api/obvius')
					.field('username', obviusUser.username)
					.field('password', obviusUser.password)
					.field('mode', manifestRequestMode);

				//logfile upload should respond with 200, success
				expect(upload).to.have.status(200);

				//logfile request should respond with 200, success
				expect(res).to.have.status(200);

				//get "all" config files to compare to response
				const allConfigfiles = await Configfile.getAll(conn);
				let response = '';
				for (f of allConfigfiles) {
					response += `CONFIGFILE,${f.makeFilename()},${f.hash},${f.created.format('YYYY-MM-DD hh:mm:ss')}`;
				}

				//the third line of the response should be the config file
				expect(res.text.split("\n")[2]).equals(response);
			});
		});
	});
});
