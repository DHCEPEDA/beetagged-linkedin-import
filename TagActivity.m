//
//  TagActivity.m
//  TagLoading
//
//  Created by Chris O'Neil on 1/25/14.
//  Copyright (c) 2014 Chris O'Neil. All rights reserved.
//

#import "TagActivity.h"

@interface TagActivity()
@property (nonatomic, strong) UIView *darkSpot;
@property (nonatomic, strong) NSTimer *timer;
@property (nonatomic, assign) enum TagActivityLocationType location;
@property (nonatomic, assign) CGFloat darkWidth;
@property (nonatomic, assign) CGFloat darkHeight;


@end

@implementation TagActivity

- (id)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
        self.timer = nil;
        self.location = TagActivityTopLeft;
        self.darkHeight = self.frame.size.height / 2;
        self.darkWidth = self.frame.size.width / 2;
        self.darkSpot = [[UIView alloc] initWithFrame:CGRectMake(0, 0, self.darkWidth, self.darkHeight)];
        [self addSubview:self.darkSpot];
        [self setDefaults];
        [self style];
    }
    return self;
}

- (void)setDefaults {
    self.interval = .3;
    self.lightColor = [UIColor lightGrayColor];
    self.darkColor = [UIColor darkGrayColor];
}

- (void)style {
    self.backgroundColor = self.lightColor;
    self.darkSpot.backgroundColor = self.darkColor;
}

- (void)start {
    self.timer = [NSTimer scheduledTimerWithTimeInterval:self.interval
                                                  target:self
                                                selector:@selector(update)
                                                userInfo:nil
                                                 repeats:YES];
}

- (void)end {
    [self.timer invalidate];
    self.timer = nil;
    self.location = TagActivityTopLeft;
    [self.darkSpot setFrame:CGRectMake(0, 0, self.darkWidth, self.darkHeight)];
}

- (void)update {
    CGRect f;
    BOOL canEditFrame = YES;
    switch (self.location) {
        case TagActivityTopLeft:
            f = CGRectMake(0, 0, self.darkWidth, self.darkHeight);
            self.location++;
            break;
        case TagActivityTopRight:
            f = CGRectMake(self.darkWidth, 0, self.darkWidth, self.darkHeight);
            self.location++;
            break;
        case TagActivityBottomRight:
            f = CGRectMake(self.darkWidth, self.darkHeight, self.darkWidth, self.darkHeight);
            self.location++;
            break;
        case TagActivityBottomLeft:
            f = CGRectMake(0, self.darkHeight, self.darkWidth, self.darkHeight);
            self.location = TagActivityTopLeft;
            break;
        default:
            canEditFrame = NO;
            break;
    }
    
    if (canEditFrame) {
        [UIView animateWithDuration:.001 animations:^{
            [self.darkSpot setFrame:f];
        }];
    }
}

/*
// Only override drawRect: if you perform custom drawing.
// An empty implementation adversely affects performance during animation.
- (void)drawRect:(CGRect)rect
{
    // Drawing code
}
*/

@end
