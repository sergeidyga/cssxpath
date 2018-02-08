class CssConverter {

    constructor(rule) {
        this.rule = rule;
    }

    parseAsterisk() {
        const asterisk = patterns.asterisk(this.rule);
        if (asterisk) {
            parts[index] = '*';
            rule = rule.substr(asterisk.fullGroup.length);
    }
    // Match '*'

    }
}