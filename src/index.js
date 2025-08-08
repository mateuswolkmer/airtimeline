import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import timelineItems from "./timelineItems.js";
import { assignLanes } from "./assignLanes.js";

const views = {
  month: "month",
  week: "week",
  day: "day",
};

function App() {
  const lanes = assignLanes(timelineItems);
  console.log(lanes);

  // Use a single date to represent the current focus
  const [view, setView] = useState(views.month);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper to get the start of the week for a given date (Sunday)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  };

  // Helper to get the start of the month for a given date
  const getStartOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // Navigation handlers
  const handleNext = () => {
    if (view === views.month) {
      const nextMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      );
      setCurrentDate(nextMonth);
    } else if (view === views.week) {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    } else if (view === views.day) {
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);
      setCurrentDate(nextDay);
    }
  };

  const handlePrevious = () => {
    if (view === views.month) {
      const prevMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
      setCurrentDate(prevMonth);
    } else if (view === views.week) {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    } else if (view === views.day) {
      const prevDay = new Date(currentDate);
      prevDay.setDate(currentDate.getDate() - 1);
      setCurrentDate(prevDay);
    }
  };

  // When switching views, keep the same date but show the full month/week/day
  const handleSetView = (v) => {
    setView(v);
    // No need to change currentDate, just change the view
  };

  // laneColumns: array of Date objects for the current view
  const laneColumns = useMemo(() => {
    if (view === views.month) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return Array.from(
        { length: daysInMonth },
        (_, i) => new Date(year, month, i + 1)
      );
    }
    if (view === views.week) {
      const startOfWeek = getStartOfWeek(currentDate);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
      });
    }
    if (view === views.day) {
      return [new Date(currentDate)];
    }
    return [];
  }, [view, currentDate]);

  // Helper: get index of a date in laneColumns
  const getColumnIndex = (date) => {
    return laneColumns.findIndex(
      (col) =>
        col.getFullYear() === date.getFullYear() &&
        col.getMonth() === date.getMonth() &&
        col.getDate() === date.getDate()
    );
  };

  // Helper: get the span (number of columns) for an item
  const getItemSpan = (item) => {
    const start = new Date(item.start);
    const end = new Date(item.end);
    const startIdx = getColumnIndex(start);
    const endIdx = getColumnIndex(end);
    if (startIdx === -1 || endIdx === -1) return 0;
    return endIdx - startIdx + 1;
  };

  // Helper: get the left offset (number of columns before the item starts)
  const getItemOffset = (item) => {
    const start = new Date(item.start);
    return getColumnIndex(start);
  };

  // Helper: find the closest event in the past
  const findClosestPastEvent = () => {
    const refDate = new Date(currentDate);
    refDate.setHours(0, 0, 0, 0);

    let closestEvent = null;
    let minDaysDiff = Infinity;

    timelineItems.forEach((item) => {
      const eventDate = new Date(item.start);
      eventDate.setHours(0, 0, 0, 0);

      if (eventDate < refDate) {
        const daysDiff = Math.abs(refDate - eventDate) / (1000 * 60 * 60 * 24);
        if (daysDiff < minDaysDiff) {
          minDaysDiff = daysDiff;
          closestEvent = item;
        }
      }
    });

    return closestEvent;
  };

  // Helper: find the closest event in the future
  const findClosestFutureEvent = () => {
    const refDate = new Date(currentDate);
    refDate.setHours(0, 0, 0, 0);

    let closestEvent = null;
    let minDaysDiff = Infinity;

    timelineItems.forEach((item) => {
      const eventDate = new Date(item.start);
      eventDate.setHours(0, 0, 0, 0);

      if (eventDate > refDate) {
        const daysDiff = Math.abs(refDate - eventDate) / (1000 * 60 * 60 * 24);
        if (daysDiff < minDaysDiff) {
          minDaysDiff = daysDiff;
          closestEvent = item;
        }
      }
    });

    return closestEvent;
  };

  // Helper: navigate to a specific date
  const navigateToDate = (date) => {
    const targetDate = new Date(date);
    setCurrentDate(targetDate);
  };

  const handleGoToClosestPast = () => {
    const closestPastEvent = findClosestPastEvent();
    if (closestPastEvent) {
      navigateToDate(closestPastEvent.start);
    }
  };

  const handleGoToClosestFuture = () => {
    const closestFutureEvent = findClosestFutureEvent();
    if (closestFutureEvent) {
      navigateToDate(closestFutureEvent.start);
    }
  };

  // Check if there are past and future events
  const hasPastEvents = findClosestPastEvent() !== null;
  const hasFutureEvents = findClosestFutureEvent() !== null;

  // Check if there are any events currently visible in the current view
  const hasVisibleEvents = useMemo(() => {
    // For each item, check if any part of it is visible in the current laneColumns
    return timelineItems.some((item) => {
      const itemStart = new Date(item.start);
      const itemEnd = new Date(item.end);
      // Find if any column is within the item's range
      return laneColumns.some((col) => {
        return col >= itemStart && col <= itemEnd;
      });
    });
  }, [timelineItems, laneColumns]);

  // For the header, show the month/year for month view, week range for week view, and date for day view
  let headerLabel = "";
  if (view === views.month) {
    const monthDate = getStartOfMonth(currentDate);
    headerLabel = `${monthDate.toLocaleString("default", {
      month: "long",
    })} ${monthDate.getFullYear()}`;
  } else if (view === views.week) {
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    headerLabel = `${startOfWeek.toLocaleString("default", {
      month: "short",
      day: "numeric",
    })} - ${endOfWeek.toLocaleString("default", {
      month: "short",
      day: "numeric",
    })} ${endOfWeek.getFullYear()}`;
  } else if (view === views.day) {
    headerLabel = currentDate.toLocaleString("default", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="p-8 w-screen h-screen">
      {/* Timeline */}
      <section className="flex flex-col size-full rounded-xl bg-background-section border border-border">
        <header className="flex justify-between items-center p-4 border-b-border border-b">
          <h1 className="text-2xl font-bold">Timeline</h1>
          <div className="flex gap-2">
            {Object.values(views).map((v) => (
              <button
                key={v}
                onClick={() => handleSetView(v)}
                className={`${
                  view === v ? "bg-blue-500 text-white" : "bg-white text-black"
                } px-4 py-2 rounded-md`}
              >
                {v}
              </button>
            ))}
          </div>
        </header>
        <nav className="flex flex-col items-center py-2 border-b-border border-b gap-2">
          <div className="flex gap-2 w-full justify-between px-4">
            <button onClick={handlePrevious}>
              <span>{"<"}</span>
            </button>
            <span>{headerLabel}</span>
            <button onClick={handleNext}>
              <span>{">"}</span>
            </button>
          </div>
          <div className="flex gap-2 w-full">
            <div className="flex w-full flex-1">
              {laneColumns.map((column) => {
                const isToday =
                  column.getDate() === new Date().getDate() &&
                  column.getMonth() === new Date().getMonth() &&
                  column.getFullYear() === new Date().getFullYear();
                return (
                  <div
                    key={column.toISOString()}
                    className="flex-1 text-center border-r last:border-r-0 border-border"
                  >
                    <span className={`${isToday ? "text-blue-500" : ""}`}>
                      {column.getUTCDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </nav>
        <main className="py-4 relative size-full">
          {!hasVisibleEvents && hasPastEvents && (
            <button
              onClick={handleGoToClosestPast}
              className="absolute top-2 left-2 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 z-10"
            >
              Go to closest past event
            </button>
          )}
          {!hasVisibleEvents && hasFutureEvents && (
            <button
              onClick={handleGoToClosestFuture}
              className="absolute top-2 right-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 z-10"
            >
              Go to closest future event
            </button>
          )}
          <div
            className="grid w-full"
            style={{
              gridTemplateColumns: `repeat(${laneColumns.length}, minmax(0, 1fr))`,
            }}
          >
            {/* Render a column border for each column, spanning all rows */}
            {laneColumns.map((_, colIdx) => (
              <div
                key={`col-border-${colIdx}`}
                className="absolute top-2 bottom-2 border-l border-border/25 pointer-events-none"
                style={{
                  left: `calc(${(colIdx / laneColumns.length) * 100}% )`,
                  gridRow: `1 / span ${lanes.length || 1}`,
                  gridColumn: colIdx + 1,
                }}
                aria-hidden="true"
              />
            ))}
            {lanes.map((lane, laneIdx) =>
              lane.map((item, idx) => {
                const offset = getItemOffset(item);
                const span = getItemSpan(item);
                if (span <= 0 || offset < 0) return null;
                return (
                  <div
                    key={item.id}
                    className="bg-white flex items-center justify-center p-4 rounded border border-border z-10"
                    style={{
                      gridRow: laneIdx + 1,
                      gridColumn: `${offset + 1} / span ${span}`,
                    }}
                  >
                    {item.name}
                  </div>
                );
              })
            )}
            {/* Render empty cells to ensure grid rows are visible even if no items */}
            {lanes.map((lane, laneIdx) =>
              lane.length === 0 ? (
                <React.Fragment key={`empty-row-${laneIdx}`}>
                  {laneColumns.map((_, colIdx) => (
                    <div
                      key={`empty-cell-${laneIdx}-${colIdx}`}
                      style={{
                        gridRow: laneIdx + 1,
                        gridColumn: colIdx + 1,
                        minHeight: 48,
                        minWidth: 0,
                        background: "transparent",
                      }}
                    />
                  ))}
                </React.Fragment>
              ) : null
            )}
          </div>
        </main>
      </section>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
