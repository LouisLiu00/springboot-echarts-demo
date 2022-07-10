package louis.echarts.util;

import java.time.LocalDate;

/**
 * @ClassName DateUtil
 * @Description 日期工具类
 * @Author Louis
 * @Date 2022/03/17 13:14
 */
public final class DateUtil {

    /**
     * @Description 当前年份
     * @Title currentYear
     * @Param []
     * @Return int
     * @Author Louis
     * @Date 2022/01/18 18:42
     */
    public static int currentYear() {
        return LocalDate.now().getYear();
    }

    /**
    * @Description 当前月份
    * @Param []
    * @Return int
    * @Author Louis
    * @Date 2022/05/27 15:26:37
    */
    public static int currentMonth() {
        return LocalDate.now().getMonthValue();
    }

    /**
    * @Description 当前日期
    * @Param []
    * @Return int
    * @Author Louis
    * @Date 2022/05/27 16:09:35
    */
    public static int currentDay() {
        return LocalDate.now().getDayOfMonth();
    }


}
