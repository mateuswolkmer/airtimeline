import React, { useMemo, useState, useCallback } from "react";
import ReactDOM from "react-dom/client";
import timelineItems from "./timelineItems.js";
import { assignLanes } from "./assignLanes.js";
import { twMerge } from "tailwind-merge";

const views = {
  month: "month",
  week: "week",
  day: "day",
};

function App() {
  const [items, setItems] = useState(timelineItems);
  const lanes = assignLanes(items);
  console.log(lanes);

  // Use a single date to represent the current focus
  const [view, setView] = useState(views.month);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Drag state
  const [dragState, setDragState] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState(null);

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

    items.forEach((item) => {
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

    items.forEach((item) => {
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
    return items.some((item) => {
      const itemStart = new Date(item.start);
      const itemEnd = new Date(item.end);
      // Find if any column is within the item's range
      return laneColumns.some((col) => {
        return col >= itemStart && col <= itemEnd;
      });
    });
  }, [items, laneColumns]);

  // Drag handlers
  const handleDragStart = useCallback(
    (e, itemId, handle) => {
      e.preventDefault();
      setIsDragging(true);

      // Find the item to get original dates
      const item = items.find((item) => item.id === itemId);
      if (!item) return;

      setDragState({
        itemId,
        handle, // 'start' or 'end'
        startX: e.clientX,
        startY: e.clientY,
        originalStart: item.start,
        originalEnd: item.end,
        accumulatedDelta: 0, // Track accumulated pixel movement
      });

      // Set initial preview
      setDragPreview({
        start: item.start,
        end: item.end,
        name: item.name,
      });
    },
    [items]
  );

  const handleDragMove = useCallback(
    (e) => {
      if (!dragState || !isDragging) return;

      const deltaX = e.clientX - dragState.startX;
      const totalDeltaX = dragState.accumulatedDelta + deltaX;

      // Get the timeline container element to calculate accurate column width
      const timelineContainer = document.querySelector(".grid");
      if (!timelineContainer) return;

      const containerRect = timelineContainer.getBoundingClientRect();
      const columnWidth = containerRect.width / laneColumns.length;

      // Calculate how many columns we've moved
      const columnDelta = totalDeltaX / columnWidth;
      const roundedColumnDelta = Math.round(columnDelta);

      // Find the item being dragged
      const itemIndex = items.findIndex((item) => item.id === dragState.itemId);
      if (itemIndex === -1) return;

      const item = items[itemIndex];
      const newItems = [...items];

      if (dragState.handle === "start") {
        // Calculate new start date from original
        const originalStartDate = new Date(dragState.originalStart);
        const newStartDate = new Date(originalStartDate);
        newStartDate.setDate(originalStartDate.getDate() + roundedColumnDelta);

        // Ensure start date doesn't go after end date
        const endDate = new Date(item.end);
        if (newStartDate < endDate) {
          newItems[itemIndex] = {
            ...item,
            start: newStartDate.toISOString().split("T")[0],
          };
          setItems(newItems);

          // Update drag preview
          setDragPreview((prev) => ({
            ...prev,
            start: newStartDate.toISOString().split("T")[0],
          }));
        }
      } else if (dragState.handle === "end") {
        // Calculate new end date from original
        const originalEndDate = new Date(dragState.originalEnd);
        const newEndDate = new Date(originalEndDate);
        newEndDate.setDate(originalEndDate.getDate() + roundedColumnDelta);

        // Ensure end date doesn't go before start date
        const startDate = new Date(item.start);
        if (newEndDate > startDate) {
          newItems[itemIndex] = {
            ...item,
            end: newEndDate.toISOString().split("T")[0],
          };
          setItems(newItems);

          // Update drag preview
          setDragPreview((prev) => ({
            ...prev,
            end: newEndDate.toISOString().split("T")[0],
          }));
        }
      }

      // Update drag state with accumulated delta
      setDragState((prev) => ({
        ...prev,
        startX: e.clientX,
        startY: e.clientY,
        accumulatedDelta: totalDeltaX,
      }));
    },
    [dragState, isDragging, items, laneColumns.length]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragState(null);
    setDragPreview(null);
  }, []);

  // Add event listeners for drag
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleDragMove);
        document.removeEventListener("mouseup", handleDragEnd);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

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

          {/* Drag preview tooltip */}
          {isDragging && dragPreview && (
            <div
              className="fixed bg-active text-white px-3 py-2 rounded text-sm z-50 pointer-events-none"
              style={{
                left: dragState?.startX + 10,
                top: dragState?.startY - 40,
              }}
            >
              <div className=" opacity-75">
                {/* {new Date(dragPreview.start).toLocaleDateString()} →{" "} */}
                <span title="Old end date" className="line-through opacity-60">
                  {new Date(
                    dragState?.handle === "start"
                      ? dragState.originalEnd
                      : dragState.originalEnd
                  ).toLocaleDateString()}
                </span>{" "}
                <span title="New end date">
                  {new Date(dragPreview.end).toLocaleDateString()}
                </span>
              </div>
            </div>
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

                const isBeingDragged = dragState?.itemId === item.id;

                return (
                  <div
                    key={item.id}
                    className={twMerge(
                      "bg-white flex flex-col gap-2 py-2 px-4 rounded border border-border z-10 relative",
                      isBeingDragged
                        ? "opacity-75 shadow-lg"
                        : "hover:shadow-md"
                    )}
                    style={{
                      gridRow: laneIdx + 1,
                      gridColumn: `${offset + 1} / span ${span}`,
                    }}
                  >
                    {/* Left drag handle */}
                    <button
                      className={twMerge(
                        "absolute left-1 top-1 bottom-1 w-2 rounded-full cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity",
                        isBeingDragged && dragState?.handle === "start"
                          ? "bg-active opacity-100"
                          : "bg-hover"
                      )}
                      onMouseDown={(e) => handleDragStart(e, item.id, "start")}
                      title="Drag to resize start date"
                    />

                    {/* Right drag handle */}
                    <button
                      className={`absolute right-1 top-1 bottom-1 w-2 rounded-full cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity ${
                        isBeingDragged && dragState?.handle === "end"
                          ? "bg-active opacity-100"
                          : "bg-hover"
                      }`}
                      onMouseDown={(e) => handleDragStart(e, item.id, "end")}
                      title="Drag to resize end date"
                    />

                    <span className="font-medium truncate" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-xs opacity-75 truncate">
                      {new Date(item.start).toLocaleDateString()} -{" "}
                      {new Date(item.end).toLocaleDateString()}
                    </span>
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
