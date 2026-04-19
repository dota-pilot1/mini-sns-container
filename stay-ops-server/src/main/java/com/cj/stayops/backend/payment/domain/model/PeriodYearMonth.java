package com.cj.stayops.backend.payment.domain.model;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Objects;

import com.cj.stayops.backend.payment.domain.exception.InvalidPaymentFieldException;

/**
 * "YYYY-MM" 형식의 결제 대상 월. (예: "2026-04")
 * <p>
 * 내부적으로 {@link YearMonth} 로 보관하고 직렬화 시에는 zero-padded ISO 형식으로 출력한다.
 */
public final class PeriodYearMonth {

	private static final DateTimeFormatter FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

	private final YearMonth value;

	private PeriodYearMonth(YearMonth value) {
		this.value = Objects.requireNonNull(value, "PeriodYearMonth value must not be null");
	}

	public static PeriodYearMonth of(String text) {
		if (text == null || text.isBlank()) {
			throw new InvalidPaymentFieldException("periodYearMonth",
				"기간(YYYY-MM)이 비어 있습니다.");
		}
		try {
			return new PeriodYearMonth(YearMonth.parse(text, FORMAT));
		} catch (DateTimeParseException e) {
			throw new InvalidPaymentFieldException("periodYearMonth",
				"기간 형식이 올바르지 않습니다. (예: 2026-04) 입력값=" + text);
		}
	}

	public static PeriodYearMonth of(YearMonth value) {
		return new PeriodYearMonth(value);
	}

	public static PeriodYearMonth from(LocalDate date) {
		return new PeriodYearMonth(YearMonth.from(date));
	}

	public YearMonth value() {
		return value;
	}

	public String asString() {
		return value.format(FORMAT);
	}

	/** 해당 월의 1일. */
	public LocalDate firstDay() {
		return value.atDay(1);
	}

	/** 해당 월의 마지막 일. */
	public LocalDate lastDay() {
		return value.atEndOfMonth();
	}

	/**
	 * 주어진 계약 기간(startDate ~ endDate) 안에 이 기준월이 (적어도 일부) 포함되는지 검사.
	 * 월 단위 비교이므로 endDate 가 4월 1일이라도 4월은 포함된다고 본다.
	 */
	public boolean isWithin(LocalDate startDate, LocalDate endDate) {
		LocalDate first = firstDay();
		LocalDate last = lastDay();
		return !endDate.isBefore(first) && !startDate.isAfter(last);
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof PeriodYearMonth other)) return false;
		return value.equals(other.value);
	}

	@Override
	public int hashCode() {
		return value.hashCode();
	}

	@Override
	public String toString() {
		return asString();
	}
}
