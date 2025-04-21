export const validateEmail = (email: string) =>
    String(email)
        .toLowerCase()
        .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

export const createSafeUrlFromTitle = (title: string) => {
    // Convert to lowercase and remove special characters and spaces
    const safeTitle = title.toLowerCase().replace(/[^\w\s]/g, '-');

    // Replace spaces with hyphens
    return safeTitle.replace(/\s+/g, '_').replace(/\+/g, '_');
};
