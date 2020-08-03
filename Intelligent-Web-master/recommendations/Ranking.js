const _ = require('lodash');
let Euclidean = require('./Euclidean');
let Pearson = require('./Pearson');


module.exports = class Rank {

// Returns the best matches for user from the prefs dictionary.
// Number of results and similarity function are optional params.

    topMatches(prefs, user, n = 5, similarity = 'sim_pearson') {

        let scores = [];
        let prefsWithoutUser = _.omit(prefs, user);

        _.forIn(prefsWithoutUser, (value, key) => {

            let score = {
                user: key
            };

            if (similarity === 'sim_pearson')
                score.score = Pearson.sim(prefs, user, key);

            if (similarity === 'sim_euclidean')
                score.score = Euclidean.sim(prefs, user, key);

            scores.push(score);

        });

        scores = _.reverse(_.sortBy(scores, 'score'));
        scores.length = n;

        return scores;

    }


    /**
     *  Gets recommendations for a user by using a weighted average
     *  of every other user's rankings
     * @param prefs {[ { userId: [{storyId, rating}] } ]} all users' ratings
     * @param user {String} userId
     * @param similarity {String} 'sim_pearson' or 'sim_euclidean'
     * @returns { [{storyId, score}] } Array of scores
     */
    getRecommendations(prefs, user, similarity = 'sim_pearson') {

        let totals = {};
        let simSums = {};

        // Don't compare me to myself
        let prefsWithoutUser = _.omit(prefs, user);

        _.forIn(prefsWithoutUser, (value, key) => {

            let sim;

            if (similarity === 'sim_pearson')
                sim = Pearson.sim(prefs, user, key);

            if (similarity === 'sim_euclidean')
                sim = Euclidean.sim(prefs, user, key);

            // Ignore scores of zero or lower
            if (sim <= 0) return;

            _.each(prefs[key], (pref) => {

                let key = _.keys(pref)[0];
                let seen = _.some(prefs[user], key);

                if (!seen) {

                    // Similarity * Score
                    if (totals[key] === undefined) totals[key] = 0;
                    totals[key] += pref[key] * sim;

                    // Sum of similarities
                    if (simSums[key] === undefined) simSums[key] = 0;
                    simSums[key] += sim;

                }

            });

        });

        let scores = _.map(totals, (value, key) => {
            return {
                storyId: key,
                score: value / simSums[key]
            }
        });

        scores = _.reverse(_.sortBy(scores, 'score'));

        return scores;

    }
};
// console.log(topMatches(critics, 'Toby', 3));
// console.log(getRecommendations(critics, 'Toby'));
