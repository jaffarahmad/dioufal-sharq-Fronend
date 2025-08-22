import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span>© 2025 DIOUF AL-SHARQ GENERAL CONTRACTING COMPANY</span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center">
              Made with{" "}
              <Heart
                className="h-3 w-3 mx-1 text-red-500"
                fill="currentColor"
              />{" "}
              for Construction Excellence
            </span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-center text-xs text-gray-500 dark:text-gray-500">
            Address: Gharnath Street, opposite Saudi Aramco complex, Mushrifa,
            Jeddah KSA
          </p>
          <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-1">
            Building the Future • Delivering Quality • Saudi Arabia
          </p>
        </div>
      </div>
    </footer>
  );
}
