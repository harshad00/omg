// Import required modules
import('chai').then(chai => {
    // Now you can use Chai as usual
    const assert = chai.assert;
    const expect = chai.expect;
    const should = chai.should();
const chaiHttp = require('chai-http');
const app = require('../app'); // Assuming your Express app is exported from 'app.js'

// Configure chai
chai.use(chaiHttp);
chai.should();

// Example test suite for the '/profile' route
describe('Profile Route', () => {
    // Test the GET '/profile' route
    describe('GET /profile', () => {
        it('it should render the profile page for authenticated users', (done) => {
            chai.request(app)
                .get('/profile')
                .set('Cookie', ['your-auth-cookie=your-auth-token']) // Set authentication cookie
                .end((err, res) => {
                    res.should.have.status(200);
                    res.should.be.html;
                    done();
                });
        });

        it('it should redirect unauthenticated users to the login page', (done) => {
            chai.request(app)
                .get('/profile')
                .end((err, res) => {
                    res.should.have.status(302);
                    res.should.redirectTo('/login');
                    done();
                });
        });
    });
});
});