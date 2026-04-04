export const inputStyles = {
    inputClass: (isMobileView: boolean) => `w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-jways-500 focus:ring-jways-500 border bg-white dark:bg-gray-700 dark:text-white transition-colors placeholder-gray-400 ${isMobileView ? 'text-base py-3.5 px-4' : 'text-sm py-2 px-3'}`,
    labelClass: (isMobileView: boolean) => `block font-medium text-gray-700 dark:text-gray-300 mb-1 ml-0.5 ${isMobileView ? 'text-base' : 'text-sm'}`,
    cardClass: "bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors",
    sectionTitleClass: "text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center border-b border-gray-100 dark:border-gray-700 pb-2",
    grayCardClass: "bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700 transition-colors",
    twoColGrid: (isMobileView: boolean) => `grid grid-cols-1 ${!isMobileView ? 'md:grid-cols-2' : ''} gap-3`,
};
