class User {
    /**
     *
     * @param {String} first_name
     * @param {String} last_name
     * @param {Date} birth_date
     */
    constructor(first_name, last_name, birth_date) {
        this.first_name = first_name;
        this.last_name = last_name;
        this.birth_date = birth_date;
    }
}

class Story {
    /**
     *
     * @param {int} userId
     * @param {String} text
     * @param {Date} dateTime
     */
    constructor(userId, dateTime, text) {
        this.userId = userId;
        this.dateTime = dateTime;
        this.text = text;
    }
}

class Reaction {
    /**
     *
     * @param {int} userId
     * @param {int} storyId
     * @param {enum} value
     */
    constructor(userId, storyId, value) {
        this.userId = userId;
        this.storyId = storyId;
        this.value = value;
    }

}

Reaction.REACTIONS = {
    like: "🤟" , love: "🧡", laugh: "😀", no: "🤢", wow: "😮"
};