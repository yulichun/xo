package session

import (
	"database/sql"
	"strconv"

	"github.com/savecost/datav/backend/pkg/config"

	"github.com/savecost/datav/backend/pkg/models"

	// "fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/savecost/datav/backend/pkg/db"
	"github.com/savecost/datav/backend/pkg/log"
)

var logger = log.RootLogger.New("logger", "session")

type Session struct {
	Token      string       `json:"token"`
	User       *models.User `json:"user"`
	CreateTime time.Time
}

func storeSession(s *Session) error {
	q := `insert into  sessions (user_id,sid) VALUES (?,?)`
	_, err := db.SQL.Exec(q, s.User.Id, s.Token)
	if err != nil {
		logger.Warn("store session error", "error", err)
		return err
	}
	return nil
}

func loadSession(sid string) *Session {
	var userid int64
	q := `SELECT user_id FROM sessions WHERE sid=?`
	err := db.SQL.QueryRow(q, sid).Scan(&userid)
	if err != nil {
		if err != sql.ErrNoRows {
			logger.Warn("query session error", "error", err)
		}
		return nil
	}

	user, err := models.QueryUser(userid, "", "")
	if err != nil {
		logger.Warn("query user error", "error", err)
		return nil
	}

	if user.Id == 0 {
		return nil
	}

	return &Session{
		Token: sid,
		User:  user,
	}
}

func deleteSession(sid string) {
	q := `DELETE FROM sessions  WHERE sid=?`
	_, err := db.SQL.Exec(q, sid)
	if err != nil {
		logger.Info("delete session error", "error", err)
	}
}

func getToken(c *gin.Context) string {
	return c.Request.Header.Get("X-Token")
}

func CurrentUser(c *gin.Context) *models.User {
	token := getToken(c)
	createTime, _ := strconv.ParseInt(token, 10, 64)
	if createTime != 0 {
		// check whether token is expired
		if (time.Now().Unix() - createTime/1e9) > config.Data.User.SessionExpire {
			deleteSession(token)
			return nil
		}
	}

	sess := loadSession(token)
	if sess == nil {
		// 用户未登陆或者session失效
		return nil
	}

	return sess.User
}

func CurrentUserId(c *gin.Context) int64 {
	user := CurrentUser(c)
	return user.Id
}
