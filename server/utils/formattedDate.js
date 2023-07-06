const formatDate = (dateString) => {
    const date = new Date(Date.parse(dateString));
    const options = {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Bangkok", // Set the time zone to Bangkok
    };

    return date.toLocaleDateString("en-US", options);
};

// Format the time as "HH:mm" (e.g., 13:25)
const formatTime = (dateString) => {
    const date = new Date(Date.parse(dateString));
    const options = {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Bangkok", // Set the time zone to Bangkok
    };

    return date.toLocaleTimeString("en-US", options);
};

module.exports = { formatDate, formatTime };
